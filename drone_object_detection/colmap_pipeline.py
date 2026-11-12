"""COLMAP command-line pipeline for sparse and dense 3D reconstruction."""

from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


class ColmapError(RuntimeError):
    """Raised when COLMAP is unavailable or a reconstruction step fails."""


@dataclass(frozen=True)
class ReconstructionResult:
    workspace: Path
    sparse_model: Path
    sparse_point_cloud: Path
    dense_point_cloud: Path | None = None


def resolve_colmap_executable(executable: str) -> str:
    resolved = shutil.which(executable)
    if resolved:
        return resolved

    candidate = Path(executable).expanduser()
    if candidate.is_file():
        return str(candidate.resolve())

    raise ColmapError(
        f"COLMAP executable was not found: {executable!r}. "
        "Install COLMAP and add it to PATH, or pass --colmap-executable."
    )


def _gpu_option_names(executable: str) -> tuple[str, str]:
    """Select GPU option names used by the installed COLMAP release."""
    try:
        extraction_help = subprocess.run(
            [executable, "feature_extractor", "-h"],
            check=False,
            capture_output=True,
            text=True,
        )
        help_text = f"{extraction_help.stdout}\n{extraction_help.stderr}"
    except OSError as exc:
        raise ColmapError(f"Could not query COLMAP options: {exc}") from exc

    if "FeatureExtraction.use_gpu" in help_text:
        return "--FeatureExtraction.use_gpu", "--FeatureMatching.use_gpu"
    return "--SiftExtraction.use_gpu", "--SiftMatching.use_gpu"


def _run(executable: str, command: str, *arguments: str) -> None:
    cmd = [executable, command, *arguments]
    print(f"[COLMAP] {command}")
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as exc:
        raise ColmapError(
            f"COLMAP step {command!r} failed with exit code {exc.returncode}."
        ) from exc
    except OSError as exc:
        raise ColmapError(f"Could not start COLMAP: {exc}") from exc


def _find_largest_sparse_model(sparse_dir: Path) -> Path:
    models = [
        path
        for path in sparse_dir.iterdir()
        if path.is_dir()
        and (path / "cameras.bin").exists()
        and (path / "images.bin").exists()
    ]
    if not models:
        raise ColmapError(
            "COLMAP mapper did not create a sparse model. The video may need more "
            "overlap, sharper frames, or a smaller --frame-step."
        )

    # images.bin grows with registered images, which is a practical proxy for
    # selecting the most complete model when multiple components are created.
    return max(models, key=lambda path: (path / "images.bin").stat().st_size)


def run_colmap_reconstruction(
    image_dir: Path,
    workspace: Path,
    *,
    mode: str = "sparse",
    executable: str = "colmap",
    camera_model: str = "SIMPLE_RADIAL",
    use_gpu: bool = True,
    sequential_overlap: int = 10,
) -> ReconstructionResult:
    """Reconstruct an ordered frame sequence and return artifact paths."""
    if mode not in {"sparse", "dense"}:
        raise ValueError("mode must be 'sparse' or 'dense'")
    if sequential_overlap < 1:
        raise ValueError("sequential_overlap must be at least 1")

    image_dir = image_dir.resolve()
    workspace = workspace.resolve()
    images = sorted(
        path
        for path in image_dir.iterdir()
        if path.suffix.lower() in {".jpg", ".jpeg", ".png"}
    )
    if len(images) < 2:
        raise ColmapError("At least two extracted frames are required for reconstruction.")

    colmap = resolve_colmap_executable(executable)
    extraction_gpu_option, matching_gpu_option = _gpu_option_names(colmap)
    database = workspace / "database.db"
    sparse_dir = workspace / "sparse"
    sparse_dir.mkdir(parents=True, exist_ok=True)

    gpu_value = "1" if use_gpu else "0"
    _run(
        colmap,
        "feature_extractor",
        "--database_path",
        str(database),
        "--image_path",
        str(image_dir),
        "--ImageReader.single_camera",
        "1",
        "--ImageReader.camera_model",
        camera_model,
        extraction_gpu_option,
        gpu_value,
    )
    _run(
        colmap,
        "sequential_matcher",
        "--database_path",
        str(database),
        "--SequentialMatching.overlap",
        str(sequential_overlap),
        matching_gpu_option,
        gpu_value,
    )
    _run(
        colmap,
        "mapper",
        "--database_path",
        str(database),
        "--image_path",
        str(image_dir),
        "--output_path",
        str(sparse_dir),
    )

    sparse_model = _find_largest_sparse_model(sparse_dir)
    sparse_ply = workspace / "sparse.ply"
    _run(
        colmap,
        "model_converter",
        "--input_path",
        str(sparse_model),
        "--output_path",
        str(sparse_ply),
        "--output_type",
        "PLY",
    )

    dense_ply = None
    if mode == "dense":
        dense_dir = workspace / "dense"
        dense_dir.mkdir(parents=True, exist_ok=True)
        _run(
            colmap,
            "image_undistorter",
            "--image_path",
            str(image_dir),
            "--input_path",
            str(sparse_model),
            "--output_path",
            str(dense_dir),
            "--output_type",
            "COLMAP",
        )
        _run(
            colmap,
            "patch_match_stereo",
            "--workspace_path",
            str(dense_dir),
            "--workspace_format",
            "COLMAP",
            "--PatchMatchStereo.geom_consistency",
            "true",
        )
        dense_ply = dense_dir / "fused.ply"
        _run(
            colmap,
            "stereo_fusion",
            "--workspace_path",
            str(dense_dir),
            "--workspace_format",
            "COLMAP",
            "--input_type",
            "geometric",
            "--output_path",
            str(dense_ply),
        )

    return ReconstructionResult(
        workspace=workspace,
        sparse_model=sparse_model,
        sparse_point_cloud=sparse_ply,
        dense_point_cloud=dense_ply,
    )
