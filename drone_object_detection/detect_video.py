"""YOLO video detection, frame extraction, and optional COLMAP reconstruction.

Examples:
    python detect_video.py --source input.mp4
    python detect_video.py --source input.mp4 --extract-frames --frame-step 15
    python detect_video.py --source input.mp4 --reconstruct sparse --no-display
    python detect_video.py --source input.mp4 --reconstruct dense --colmap-no-gpu
"""
import argparse
import csv
import time
from pathlib import Path

import cv2
from ultralytics import YOLO

from colmap_pipeline import (
    ColmapError,
    resolve_colmap_executable,
    run_colmap_reconstruction,
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="YOLO video detection, frame extraction, and COLMAP reconstruction"
    )
    parser.add_argument("--source", default="0", help="Video file path or camera number (0, 1, ...)")
    parser.add_argument("--model", default="yolo11n.pt", help="Ultralytics model weights")
    parser.add_argument("--output", default="outputs/detected.mp4", help="Output annotated MP4")
    parser.add_argument("--conf", type=float, default=0.35, help="Minimum confidence (0-1)")
    parser.add_argument("--imgsz", type=int, default=640, help="Inference image size")
    parser.add_argument("--device", default="cpu", help="cpu or 0 (CUDA GPU index)")
    parser.add_argument("--no-display", action="store_true", help="Do not open preview window")
    parser.add_argument("--max-frames", type=int, default=0, help="Limit processed frames; 0 means all")
    parser.add_argument("--extract-frames", action="store_true",
                        help="Save unannotated source frames")
    parser.add_argument("--frame-dir",
                        help="Frame directory (default: outputs/frames or reconstruction/images)")
    parser.add_argument("--frame-step", type=int, default=10,
                        help="Save one source frame every N frames")
    parser.add_argument("--frame-quality", type=int, default=95,
                        help="Extracted JPEG quality from 1 to 100")
    parser.add_argument("--max-extracted-frames", type=int, default=0,
                        help="Maximum frames to extract; 0 means unlimited")
    parser.add_argument("--reconstruct", choices=("sparse", "dense"),
                        help="Run COLMAP after detection; also extracts frames")
    parser.add_argument("--reconstruction-dir", default="outputs/reconstruction",
                        help="COLMAP workspace; suffix added when non-empty")
    parser.add_argument("--colmap-executable", default="colmap",
                        help="COLMAP executable name or full path")
    parser.add_argument("--colmap-camera-model", default="SIMPLE_RADIAL",
                        help="COLMAP camera model")
    parser.add_argument("--colmap-overlap", type=int, default=10,
                        help="Neighboring frames used by sequential matching")
    parser.add_argument("--colmap-no-gpu", action="store_true",
                        help="Run COLMAP SIFT extraction and matching on CPU")
    return parser.parse_args()


def unique_output_dir(requested: Path) -> Path:
    """Return an unused directory path without deleting previous results."""
    if requested.exists() and not requested.is_dir():
        raise SystemExit(f"Output path is not a directory: {requested}")
    if not requested.exists() or not any(requested.iterdir()):
        return requested

    index = 2
    while True:
        candidate = requested.with_name(f"{requested.name}_{index}")
        if not candidate.exists() or not any(candidate.iterdir()):
            print(f"Output directory is not empty; using: {candidate}")
            return candidate
        index += 1


def main():
    args = parse_args()
    if not 0 <= args.conf <= 1:
        raise SystemExit("--conf must be between 0 and 1")
    if args.frame_step < 1:
        raise SystemExit("--frame-step must be at least 1")
    if not 1 <= args.frame_quality <= 100:
        raise SystemExit("--frame-quality must be between 1 and 100")
    if args.max_extracted_frames < 0:
        raise SystemExit("--max-extracted-frames cannot be negative")
    if args.colmap_overlap < 1:
        raise SystemExit("--colmap-overlap must be at least 1")

    extract_frames = args.extract_frames or args.reconstruct is not None
    reconstruction_dir = None
    frame_dir = None
    if args.reconstruct:
        try:
            args.colmap_executable = resolve_colmap_executable(args.colmap_executable)
        except ColmapError as exc:
            raise SystemExit(f"3D reconstruction unavailable: {exc}") from exc
        reconstruction_dir = unique_output_dir(Path(args.reconstruction_dir))
        reconstruction_dir.mkdir(parents=True, exist_ok=True)
        frame_dir = (unique_output_dir(Path(args.frame_dir))
                     if args.frame_dir else reconstruction_dir / "images")
    elif extract_frames:
        frame_dir = unique_output_dir(Path(args.frame_dir or "outputs/frames"))

    if frame_dir is not None:
        frame_dir.mkdir(parents=True, exist_ok=True)

    source = int(args.source) if args.source.isdecimal() else args.source
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise SystemExit(f"Could not open input: {args.source}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or fps > 240:
        fps = 25.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if width <= 0 or height <= 0:
        cap.release()
        raise SystemExit("Could not determine video size")

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    csv_output = output.with_suffix(".csv")
    model = YOLO(args.model)
    writer = cv2.VideoWriter(str(output), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
    if not writer.isOpened():
        cap.release()
        raise SystemExit(f"Could not open output for writing: {output}")

    frames = 0
    detections = 0
    extracted_frames = 0
    t0 = time.perf_counter()
    try:
        with csv_output.open("w", newline="", encoding="utf-8-sig") as f:
            csv_writer = csv.writer(f)
            csv_writer.writerow(["frame", "time_sec", "class", "confidence", "x1", "y1", "x2", "y2"])
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                frames += 1
                should_extract = (
                    frame_dir is not None
                    and (frames - 1) % args.frame_step == 0
                    and (args.max_extracted_frames == 0
                         or extracted_frames < args.max_extracted_frames)
                )
                if should_extract:
                    frame_path = frame_dir / f"frame_{frames:08d}.jpg"
                    saved = cv2.imwrite(
                        str(frame_path), frame,
                        [cv2.IMWRITE_JPEG_QUALITY, args.frame_quality],
                    )
                    if not saved:
                        raise RuntimeError(f"Could not save extracted frame: {frame_path}")
                    extracted_frames += 1

                result = model.predict(frame, conf=args.conf, imgsz=args.imgsz,
                                       device=args.device, verbose=False)[0]
                annotated = result.plot()
                boxes = result.boxes
                if boxes is not None:
                    for b in boxes:
                        cls = int(b.cls[0].item())
                        label = result.names[cls]
                        confidence = float(b.conf[0].item())
                        x1, y1, x2, y2 = (int(v) for v in b.xyxy[0].tolist())
                        csv_writer.writerow([frames, round((frames - 1) / fps, 3), label,
                                             round(confidence, 4), x1, y1, x2, y2])
                        detections += 1
                writer.write(annotated)
                if not args.no_display:
                    try:
                        cv2.imshow("YOLO Object Detection - press q to quit", annotated)
                        if cv2.waitKey(1) & 0xFF == ord("q"):
                            break
                    except cv2.error:
                        print("Display unavailable; continuing without preview.")
                        args.no_display = True
                if args.max_frames > 0 and frames >= args.max_frames:
                    break
    finally:
        cap.release()
        writer.release()
        cv2.destroyAllWindows()

    elapsed = time.perf_counter() - t0
    print(f"Output video: {output.resolve()}")
    print(f"Output CSV:   {csv_output.resolve()}")
    print(f"Frames: {frames} | Detections: {detections} | Processing FPS: {frames / elapsed:.2f}")
    print("Note: CSV detections count objects per frame, not unique objects.")

    if frame_dir is not None:
        print(f"Extracted frames: {frame_dir.resolve()} ({extracted_frames} images)")

    if args.reconstruct:
        try:
            reconstruction = run_colmap_reconstruction(
                frame_dir,
                reconstruction_dir,
                mode=args.reconstruct,
                executable=args.colmap_executable,
                camera_model=args.colmap_camera_model,
                use_gpu=not args.colmap_no_gpu,
                sequential_overlap=args.colmap_overlap,
            )
        except ColmapError as exc:
            raise SystemExit(f"3D reconstruction failed: {exc}") from exc

        print(f"COLMAP workspace:   {reconstruction.workspace}")
        print(f"Sparse model:       {reconstruction.sparse_model}")
        print(f"Sparse point cloud: {reconstruction.sparse_point_cloud}")
        if reconstruction.dense_point_cloud is not None:
            print(f"Dense point cloud:  {reconstruction.dense_point_cloud}")


if __name__ == "__main__":
    main()
