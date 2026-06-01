import os
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from converter import convert_image_to_svg

load_dotenv()

app = FastAPI(title="Image to SVG Converter API")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/convert")
async def convert(
    file: UploadFile = File(...),
    remove_background: bool = Form(False),
):
    try:
        image_bytes = await file.read()
        svg_content, similarity = convert_image_to_svg(
            image_bytes=image_bytes,
            remove_background=remove_background,
        )
        filename = os.path.splitext(file.filename)[0] + ".svg"
        return JSONResponse({
            "success": True,
            "svg_content": svg_content,
            "filename": filename,
            "similarity": similarity,
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)
