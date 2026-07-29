from pathlib import Path
from datetime import date

from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

BASE_DIR = Path(__file__).resolve().parent.parent.parent

TEMPLATE_PATH = BASE_DIR / "app" / "assets" / "certificate_template.png"

OUTPUT_DIR = BASE_DIR / "uploads" / "certificates"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class CertificateGenerator:

    PAGE_WIDTH = 1123
    PAGE_HEIGHT = 794

    COLORS = {
        "primary": HexColor("#A02020"),
        "secondary": HexColor("#333333"),
    }

    POSITIONS = {
        "student": {
            "y": 480,
            "font": "Helvetica-Bold",
            "size": 30,
        },
        "course": {
            "y": 330,
            "font": "Helvetica-Bold",
            "size": 28,
        },
        "date": {
            "x": 370,
            "y": 220,
            "font": "Helvetica",
            "size": 14,
        },
        "certificate_number": {
            "x": 660,
            "y": 220,
            "font": "Helvetica",
            "size": 14,
        },
    }

    @classmethod
    def draw_center_text(
        cls,
        pdf: canvas.Canvas,
        text: str,
        *,
        y: int,
        font: str,
        size: int,
        color,
    ):
        pdf.setFont(font, size)
        pdf.setFillColor(color)

        text_width = pdf.stringWidth(text, font, size)
        x = (cls.PAGE_WIDTH - text_width) / 2

        pdf.drawString(x, y, text)

    @classmethod
    def generate(
        cls,
        *,
        student_name: str,
        course_name: str,
        completion_date: date,
        certificate_number: str,
    ) -> str:

        filename = f"{certificate_number}.pdf"
        output_path = OUTPUT_DIR / filename

        pdf = canvas.Canvas(
            str(output_path),
            pagesize=(cls.PAGE_WIDTH, cls.PAGE_HEIGHT),
        )

        pdf.drawImage(
            ImageReader(str(TEMPLATE_PATH)),
            0,
            0,
            width=cls.PAGE_WIDTH,
            height=cls.PAGE_HEIGHT,
        )

        # Student Name
        cls.draw_center_text(
            pdf,
            student_name,
            color=cls.COLORS["primary"],
            **cls.POSITIONS["student"],
        )

        # Course Name
        cls.draw_center_text(
            pdf,
            course_name,
            color=cls.COLORS["primary"],
            **cls.POSITIONS["course"],
        )

        # Completion Date
        date_pos = cls.POSITIONS["date"]

        pdf.setFont(date_pos["font"], date_pos["size"])
        pdf.setFillColor(cls.COLORS["secondary"])

        pdf.drawString(
            date_pos["x"],
            date_pos["y"],
            completion_date.strftime("%d %B %Y"),
        )

        # Certificate Number
        cert = cls.POSITIONS["certificate_number"]

        pdf.setFont(cert["font"], cert["size"])
        pdf.setFillColor(cls.COLORS["secondary"])

        pdf.drawString(
            cert["x"],
            cert["y"],
            certificate_number,
        )

        print(f"Saving PDF to: {output_path}")
        pdf.save()
        print("PDF saved successfully")

        return f"uploads/certificates/{filename}"
