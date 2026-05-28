import vtracer
from rembg import remove
from PIL import Image
import io


def convert_image_to_svg(
    image_bytes: bytes,
    color_count: int = 8,
    mode: str = "spline",
    filter_speckle: int = 4,
    layer_difference: int = 16,
    remove_background: bool = False,
) -> str:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    if remove_background:
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        removed = remove(img_bytes.getvalue())
        img = Image.open(io.BytesIO(removed)).convert("RGBA")

    pixels = list(img.getdata())
    width, height = img.size

    svg = vtracer.convert_pixels_to_svg(
        pixels,
        size=(width, height),
        colormode="color",
        color_precision=color_count,
        mode=mode,
        filter_speckle=filter_speckle,
        layer_difference=layer_difference,
    )
    return svg
