# 영상 객체 탐지 및 COLMAP 3D 복원

YOLO로 영상의 객체를 탐지하고, 원본 영상에서 프레임을 추출한 뒤 COLMAP으로 카메라 자세와 3D 포인트 클라우드를 복원하는 예제입니다.

## 설치

Python 3.10~3.12를 권장합니다.

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Ubuntu/macOS
source .venv/bin/activate

python -m pip install -r requirements.txt
```

3D 복원에는 Python 패키지와 별도로 [COLMAP](https://colmap.github.io/install.html)이 필요합니다. `colmap` 명령을 PATH에 추가하거나 실행할 때 `--colmap-executable`로 경로를 지정하세요.

## 객체 탐지

```bash
python detect_video.py --source test.mp4
python detect_video.py --source 0 --no-display
python detect_video.py --source test.mp4 --device cpu --imgsz 416 --no-display
```

기본 결과는 다음과 같습니다.

- `outputs/detected.mp4`: 탐지 결과가 표시된 영상
- `outputs/detected.csv`: 프레임별 클래스, 신뢰도, 바운딩 박스 좌표

## 영상 프레임 추출

```bash
python detect_video.py --source test.mp4 --extract-frames --frame-step 10
```

원본 프레임이 `outputs/frames`에 JPEG로 저장됩니다. `--frame-step 10`은 10프레임마다 한 장을 저장한다는 뜻입니다.

주요 옵션:

- `--frame-dir PATH`: 프레임 저장 위치
- `--frame-step N`: N프레임마다 한 장 저장
- `--frame-quality 1..100`: JPEG 품질
- `--max-extracted-frames N`: 최대 저장 개수, 0은 제한 없음

## COLMAP 3D 복원

희소 복원:

```bash
python detect_video.py --source test.mp4 --reconstruct sparse --no-display
```

밀집 복원:

```bash
python detect_video.py --source test.mp4 --reconstruct dense --no-display
```

`--reconstruct`를 사용하면 원본 프레임 추출도 자동으로 활성화됩니다. 기본 작업 폴더는 `outputs/reconstruction`이며, 기존 결과가 있으면 덮어쓰지 않고 `_2`, `_3` 접미사가 붙은 새 폴더를 사용합니다.

주요 결과:

- `database.db`: COLMAP 특징점 및 매칭 데이터베이스
- `sparse/0` 등: 카메라 자세와 희소 3D 모델
- `sparse.ply`: 일반 3D 뷰어에서 열 수 있는 희소 포인트 클라우드
- `dense/fused.ply`: `--reconstruct dense`에서 생성되는 밀집 포인트 클라우드

COLMAP의 특징점 추출·매칭에 CUDA를 사용할 수 없으면 CPU 모드를 지정하세요. CPU 모드에서도 희소 복원은 가능하지만, 밀집 복원의 Patch Match Stereo 단계에는 COLMAP 빌드가 지원하는 CUDA 또는 ROCm/HIP GPU가 필요합니다.

```bash
python detect_video.py --source test.mp4 --reconstruct sparse --colmap-no-gpu --no-display
```

COLMAP 경로를 직접 지정하는 예:

```powershell
python detect_video.py --source test.mp4 --reconstruct sparse `
  --colmap-executable "C:\Program Files\COLMAP\COLMAP.bat" --no-display
```

복원 품질이 낮으면 `--frame-step`을 줄여 프레임 간 겹침을 늘리고, 흔들리거나 흐린 영상을 피하세요. 영상은 한 대의 이동 카메라로 정적인 장면을 여러 각도에서 촬영한 것이 가장 적합합니다. 움직이는 객체 자체는 일반 COLMAP만으로 안정적인 3D 복원이 어렵습니다.

## 주의

- 일반 사전학습 모델은 모든 장애물이나 구덩이를 자동으로 분류하지 못합니다. 필요한 클래스는 현장 데이터로 추가 학습해야 합니다.
- 실제 처리 속도는 보드, CPU/GPU, 해상도에 따라 달라집니다.
- 촬영 허가와 개인정보 보호 규정을 준수하세요.
