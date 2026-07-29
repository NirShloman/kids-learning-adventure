"""Build production/runtime character atlases from approved transparent key poses."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
REFERENCE_DIR = ROOT / "docs" / "art-direction" / "references"
MASTER_DIR = ROOT / "docs" / "art-direction" / "masters"
RUNTIME_DIR = ROOT / "public" / "assets" / "experience" / "characters"
CONTENT_MANIFEST = ROOT / "src" / "content" / "character-atlases.json"

SOURCE_SHEETS = {
    "nir-kippah": REFERENCE_DIR / "nir-kippah-production.png",
    "nir-plain": REFERENCE_DIR / "nir-plain-production.png",
    "shir": REFERENCE_DIR / "shir-production.png",
}

POSE_CELL = {
    "idle_front": 0,
    "idle_back": 1,
    "idle_side": 2,
    "walk_side_a": 3,
    "walk_side_b": 4,
    "walk_side_c": 5,
    "carry_front": 6,
    "carry_side": 7,
    "pickup": 8,
    "drop": 9,
    "celebrate": 10,
    "happy_idle": 11,
}

WALK_OFFSETS = [(0, 0, -1.2), (1, 2, -0.4), (0, 4, 0.6), (-1, 2, 1.1), (0, 0, 0.4), (1, -1, -0.8)]
SIDE_SEQUENCE = ["walk_side_a", "walk_side_b", "walk_side_c", "walk_side_b", "walk_side_a", "walk_side_c"]

CLIP_SPEC: list[tuple[str, list[str], int, int]] = [
    ("idle_front", ["idle_front"], 6, -1),
    ("idle_back", ["idle_back"], 6, -1),
    ("idle_side", ["idle_side"], 6, -1),
    ("walk_front", ["idle_front"] * 6, 12, -1),
    ("walk_back", ["idle_back"] * 6, 12, -1),
    ("walk_side", SIDE_SEQUENCE, 12, -1),
    ("carry_front", ["carry_front"] * 6, 12, -1),
    ("carry_back", ["idle_back"] * 6, 12, -1),
    ("carry_side", ["carry_side"] * 6, 12, -1),
    ("pickup", ["idle_side", "pickup", "drop"], 10, 0),
    ("drop", ["drop", "pickup", "idle_side"], 10, 0),
    ("celebrate", ["happy_idle", "celebrate", "celebrate", "happy_idle"], 12, 0),
]


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("Pose cell contains no visible pixels")
    return bbox


def split_pose_cells(sheet: Image.Image) -> dict[str, Image.Image]:
    cell_width = sheet.width // 4
    cell_height = sheet.height // 3
    result: dict[str, Image.Image] = {}
    for pose, index in POSE_CELL.items():
        column = index % 4
        row = index // 4
        cell = sheet.crop(
            (
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            )
        )
        result[pose] = cell.crop(alpha_bbox(cell))
    return result


def transform_pose(
    pose: Image.Image,
    scale: float,
    frame_size: tuple[int, int],
    baseline: int,
    offset_x: int,
    offset_y: int,
    rotation: float,
) -> Image.Image:
    width = max(1, round(pose.width * scale))
    height = max(1, round(pose.height * scale))
    resized = pose.resize((width, height), Image.Resampling.LANCZOS)
    if rotation:
        resized = resized.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)
    frame = Image.new("RGBA", frame_size, (0, 0, 0, 0))
    x = (frame_size[0] - resized.width) // 2 + offset_x
    y = baseline - resized.height + offset_y
    frame.alpha_composite(resized, (x, y))
    return frame


def attachment_for(clip: str) -> dict[str, float]:
    if clip == "carry_side":
        return {"x": 0.66, "y": 0.49}
    if clip == "carry_front":
        return {"x": 0.50, "y": 0.50}
    if clip in {"pickup", "drop"}:
        return {"x": 0.56, "y": 0.73}
    return {"x": 0.50, "y": 0.50}


def build_skin(skin: str, source: Path) -> dict[str, Any]:
    sheet = Image.open(source).convert("RGBA")
    poses = split_pose_cells(sheet)

    master_frame = (512, 640)
    master_baseline = 592
    target_height = 520
    common_scale = target_height / max(pose.height for pose in poses.values())
    atlas = Image.new("RGBA", (4096, 4480), (0, 0, 0, 0))

    frames: list[dict[str, Any]] = []
    animations: list[dict[str, Any]] = []
    frame_index = 0

    for clip, pose_names, frame_rate, repeat in CLIP_SPEC:
        clip_frames: list[str] = []
        for sequence_index, pose_name in enumerate(pose_names):
            offset_x, offset_y, rotation = (0, 0, 0.0)
            if len(pose_names) == 6:
                offset_x, offset_y, rotation = WALK_OFFSETS[sequence_index]
            elif clip == "celebrate":
                offset_y = [0, 4, -4, 1][sequence_index]

            frame_name = f"{skin}_{clip}_{sequence_index + 1:02d}"
            column = frame_index % 8
            row = frame_index // 8
            rendered = transform_pose(
                poses[pose_name],
                common_scale,
                master_frame,
                master_baseline,
                offset_x * 2,
                offset_y * 2,
                rotation,
            )
            atlas.alpha_composite(rendered, (column * master_frame[0], row * master_frame[1]))
            frame_record = {
                "name": frame_name,
                "index": frame_index,
                "x": column * 256,
                "y": row * 320,
                "w": 256,
                "h": 320,
                "pivot": {"x": 0.5, "y": 0.925},
                "attachment": attachment_for(clip),
            }
            frames.append(frame_record)
            clip_frames.append(frame_name)
            frame_index += 1

        animations.append(
            {
                "key": clip,
                "frames": clip_frames,
                "frameRate": frame_rate,
                "repeat": repeat,
            }
        )

    if frame_index != 49:
        raise ValueError(f"{skin}: expected 49 frames, generated {frame_index}")

    MASTER_DIR.mkdir(parents=True, exist_ok=True)
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    master_path = MASTER_DIR / f"{skin}-master.png"
    runtime_png = RUNTIME_DIR / f"{skin}-v1.png"
    runtime_webp = RUNTIME_DIR / f"{skin}-v1.webp"
    atlas.save(master_path, optimize=True)
    runtime = atlas.resize((2048, 2240), Image.Resampling.LANCZOS)
    runtime.save(runtime_png, optimize=True)
    runtime.save(runtime_webp, "WEBP", lossless=False, quality=86, method=6, exact=True)

    return {
        "skin": skin,
        "png": f"/assets/experience/characters/{runtime_png.name}",
        "webp": f"/assets/experience/characters/{runtime_webp.name}",
        "grid": {"columns": 8, "rows": 7},
        "frameSize": {"w": 256, "h": 320},
        "atlasSize": {"w": 2048, "h": 2240},
        "frames": frames,
        "animations": animations,
    }


def main() -> None:
    missing = [str(source) for source in SOURCE_SHEETS.values() if not source.exists()]
    if missing:
        raise FileNotFoundError(f"Missing character sources: {', '.join(missing)}")

    atlases = {skin: build_skin(skin, source) for skin, source in SOURCE_SHEETS.items()}
    manifest = {
        "version": 1,
        "defaultBoySkin": "nir-kippah",
        "defaultGirlSkin": "shir",
        "atlases": atlases,
    }
    CONTENT_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    CONTENT_MANIFEST.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Built {len(atlases)} atlases with 49 frames each")


if __name__ == "__main__":
    main()
