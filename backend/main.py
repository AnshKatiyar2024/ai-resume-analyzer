from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from docx import Document
import io
import re

from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import engine, Base, get_db
from models import User, ResumeHistory
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI Resume Analyzer API"
)


# =========================================
# AUTHENTICATION REQUEST MODELS
# =========================================

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
class HistoryRequest(BaseModel):
    file_name: str
    ats_score: int = 0


# =========================================
# CORS
# =========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://ai-resume-analyzer-web-99m1.onrender.com",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================
# HOME
# =========================================

@app.get("/")
def home():

    return {
        "message": "AI Resume Analyzer Backend is running!"
    }


# =========================================
# SIGNUP API
# =========================================

@app.post("/signup")
def signup(
    data: SignupRequest,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )

    hashed_password = hash_password(data.password)

    new_user = User(
        name=data.name,
        email=data.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "Account created successfully!",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        }
    }


# =========================================
# LOGIN API
# =========================================

@app.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        data.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "sub": user.email
    })

    return {
        "success": True,
        "message": "Login successful!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }


# =========================================
# PDF TEXT EXTRACTION
# =========================================

def extract_pdf_text(content):

    pdf_file = io.BytesIO(content)

    reader = PdfReader(pdf_file)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


# =========================================
# DOCX TEXT EXTRACTION
# =========================================

def extract_docx_text(content):

    docx_file = io.BytesIO(content)

    document = Document(docx_file)

    text = ""

    for paragraph in document.paragraphs:

        text += paragraph.text + "\n"

    return text


# =========================================
# ATS SCORE
# =========================================

def calculate_ats_score(text):

    text_lower = text.lower()

    score = 0


    # Contact Information

    if "@" in text:

        score += 10


    # Education

    education_keywords = [
        "education",
        "bca",
        "b.tech",
        "mca",
        "degree",
        "university",
    ]

    if any(
        keyword in text_lower
        for keyword in education_keywords
    ):

        score += 15


    # Skills

    skill_keywords = [
        "python",
        "java",
        "javascript",
        "react",
        "sql",
        "html",
        "css",
        "aws",
        "git",
    ]

    skill_count = sum(
        1
        for skill in skill_keywords
        if contains_skill(text, skill)
    )

    score += min(
        skill_count * 5,
        25
    )


    # Experience

    experience_keywords = [
        "experience",
        "internship",
        "developer",
        "intern",
    ]

    if any(
        word in text_lower
        for word in experience_keywords
    ):

        score += 15


    # Projects

    if (
        "project" in text_lower
        or "projects" in text_lower
    ):

        score += 15


    # Resume Content

    if len(text.split()) >= 200:

        score += 10


    return min(score, 100)


# =========================================
# SKILL DETECTION
# =========================================

def detect_skills(text):

    skills = [
        "python",
        "java",
        "javascript",
        "react",
        "html",
        "css",
        "sql",
        "mysql",
        "mongodb",
        "node.js",
        "express",
        "aws",
        "git",
        "github",
        "docker",
        "linux",
        "c++",
        "c",
        "typescript",
        "angular",
    ]

    detected_skills = []

    for skill in skills:

        if contains_skill(text, skill):

            detected_skills.append(skill)

    return detected_skills


# =========================================
# SUGGESTIONS
# =========================================

def generate_suggestions(text):

    text_lower = text.lower()

    suggestions = []


    # Contact

    if "@" not in text:

        suggestions.append(
            "Add your email address to the resume."
        )


    # Education

    education_keywords = [
        "education",
        "bca",
        "b.tech",
        "mca",
        "degree",
        "university",
    ]

    if not any(
        keyword in text_lower
        for keyword in education_keywords
    ):

        suggestions.append(
            "Add a clear Education section with your degree and university."
        )


    # Skills

    skill_keywords = [
        "python",
        "java",
        "javascript",
        "react",
        "sql",
        "html",
        "css",
        "aws",
        "git",
    ]

    skill_count = sum(
        1
        for skill in skill_keywords
        if contains_skill(text, skill)
    )

    if skill_count < 3:

        suggestions.append(
            "Add more relevant technical skills related to your target job."
        )


    # Experience

    experience_keywords = [
        "experience",
        "internship",
        "developer",
        "intern",
    ]

    if not any(
        word in text_lower
        for word in experience_keywords
    ):

        suggestions.append(
            "Add internship, training, or relevant practical experience if available."
        )


    # Projects

    if "project" not in text_lower:

        suggestions.append(
            "Add 2-3 relevant projects and mention the technologies used."
        )


    # Content length

    if len(text.split()) < 200:

        suggestions.append(
            "Add more relevant details to improve the overall resume content."
        )


    # Default

    if not suggestions:

        suggestions.append(
            "Your resume looks good. Keep your skills and projects relevant to the target job."
        )


    return suggestions


# =========================================
# ATS BREAKDOWN
# =========================================

def calculate_ats_breakdown(text):

    text_lower = text.lower()

    breakdown = {
        "Contact Information": 0,
        "Education": 0,
        "Skills": 0,
        "Experience": 0,
        "Projects": 0,
        "Resume Content": 0,
    }


    # Contact

    if "@" in text:

        breakdown["Contact Information"] = 10


    # Education

    education_keywords = [
        "education",
        "bca",
        "b.tech",
        "mca",
        "degree",
        "university",
    ]

    if any(
        keyword in text_lower
        for keyword in education_keywords
    ):

        breakdown["Education"] = 15


    # Skills

    skill_keywords = [
        "python",
        "java",
        "javascript",
        "react",
        "sql",
        "html",
        "css",
        "aws",
        "git",
    ]

    skill_count = sum(
        1
        for skill in skill_keywords
        if contains_skill(text, skill)
    )

    breakdown["Skills"] = min(
        skill_count * 5,
        25
    )


    # Experience

    experience_keywords = [
        "experience",
        "internship",
        "developer",
        "intern",
    ]

    if any(
        word in text_lower
        for word in experience_keywords
    ):

        breakdown["Experience"] = 15


    # Projects

    if (
        "project" in text_lower
        or "projects" in text_lower
    ):

        breakdown["Projects"] = 15


    # Resume Content

    if len(text.split()) >= 200:

        breakdown["Resume Content"] = 10


    return breakdown


# =========================================
# SKILL MATCHING HELPER
# =========================================

def contains_skill(text, skill):

    text_lower = text.lower()

    if skill in [
        "c",
        "c++",
        "java",
    ]:

        pattern = (
            rf"(?<![a-zA-Z0-9+#])"
            rf"{re.escape(skill)}"
            rf"(?![a-zA-Z0-9+#])"
        )

        return (
            re.search(
                pattern,
                text_lower
            )
            is not None
        )

    return skill in text_lower


# =========================================
# JOB DESCRIPTION MATCHING
# =========================================

def match_job_description(
    resume_text,
    job_description
):

    skills = [
        "python",
        "javascript",
        "typescript",
        "react",
        "angular",
        "node.js",
        "express",
        "java",
        "c++",
        "c",
        "html",
        "css",
        "sql",
        "mysql",
        "mongodb",
        "aws",
        "git",
        "github",
        "docker",
        "linux",
    ]


    matched_skills = []

    missing_skills = []


    for skill in skills:

        if contains_skill(
            job_description,
            skill
        ):

            if contains_skill(
                resume_text,
                skill
            ):

                matched_skills.append(skill)

            else:

                missing_skills.append(skill)


    total_required = (
        len(matched_skills)
        + len(missing_skills)
    )


    if total_required > 0:

        match_score = round(
            (
                len(matched_skills)
                / total_required
            )
            * 100
        )

    else:

        match_score = 0


    return {
        "match_score": match_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
    }


# =========================================
# RESUME UPLOAD API
# =========================================

@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):

    if not file.filename:

        return {
            "success": False,
            "message": "No file selected."
        }


    filename = file.filename.lower()


    if not filename.endswith(
        (".pdf", ".docx")
    ):

        return {
            "success": False,
            "message": "Only PDF and DOCX files are allowed."
        }


    content = await file.read()


    if not content:

        return {
            "success": False,
            "message": "Uploaded file is empty."
        }


    try:

        # PDF

        if filename.endswith(".pdf"):

            resume_text = extract_pdf_text(
                content
            )


        # DOCX

        else:

            resume_text = extract_docx_text(
                content
            )


        if not resume_text.strip():

            return {
                "success": False,
                "message": "Could not extract text from this resume."
            }


        ats_score = calculate_ats_score(
            resume_text
        )

        skills = detect_skills(
            resume_text
        )

        ats_breakdown = calculate_ats_breakdown(
            resume_text
        )

        suggestions = generate_suggestions(
            resume_text
        )


        return {
            "success": True,
            "filename": file.filename,
            "size": len(content),
            "text": resume_text,
            "ats_score": ats_score,
            "skills": skills,
            "ats_breakdown": ats_breakdown,
            "suggestions": suggestions,
            "message": "Resume uploaded and analyzed successfully!"
        }


    except Exception as e:

        return {
            "success": False,
            "message": f"Could not extract resume text: {str(e)}"
        }


# =========================================
# JOB MATCH API
# =========================================

@app.post("/match-job")
async def match_job(data: dict,
current_user: User = Depends(get_current_user)
):
    

    resume_text = data.get(
        "resume_text",
        ""
    )

    job_description = data.get(
        "job_description",
        ""
    )


    if not resume_text:

        return {
            "success": False,
            "message": "Resume text is required."
        }


    if not job_description:

        return {
            "success": False,
            "message": "Job description is required."
        }


    try:

        result = match_job_description(
            resume_text,
            job_description
        )


        return {
            "success": True,
            **result
        }


    except Exception as e:

        return {
            "success": False,
            "message": f"Job matching failed: {str(e)}"
        }


# =========================================
# SMART RESUME ANALYSIS API
# =========================================

@app.post("/ai-analysis")
async def ai_analysis(data: dict,
current_user: User = Depends(get_current_user)
):

    resume_text = data.get(
        "resume_text",
        ""
    )


    if not resume_text:

        return {
            "success": False,
            "message": "Resume text is required."
        }


    try:

        strengths = []

        weaknesses = []

        recommendations = []

        text_lower = resume_text.lower()


        # ---------------------------------
        # Strengths
        # ---------------------------------

        if any(
            contains_skill(
                resume_text,
                skill
            )
            for skill in [
                "python",
                "java",
                "javascript",
                "react",
                "sql",
            ]
        ):

            strengths.append(
                "Resume contains relevant technical skills."
            )


        if (
            "project" in text_lower
            or "projects" in text_lower
        ):

            strengths.append(
                "Resume includes practical project experience."
            )


        if (
            "github" in text_lower
            or "linkedin" in text_lower
        ):

            strengths.append(
                "Professional online profiles are included."
            )


        if (
            "education" in text_lower
            or "bca" in text_lower
            or "degree" in text_lower
        ):

            strengths.append(
                "Educational background is clearly mentioned."
            )


        if not strengths:

            strengths.append(
                "Resume contains useful information about your background."
            )


        # ---------------------------------
        # Weaknesses
        # ---------------------------------

        if not any(
            word in text_lower
            for word in [
                "experience",
                "internship",
            ]
        ):

            weaknesses.append(
                "Work experience or internship experience is limited."
            )


        if len(resume_text.split()) < 200:

            weaknesses.append(
                "Resume content could include more relevant details."
            )


        if (
            "achievement" not in text_lower
            and "achievements" not in text_lower
        ):

            weaknesses.append(
                "More measurable achievements could be highlighted."
            )


        if len(weaknesses) == 0:

            weaknesses.append(
                "Resume can still be customized for each target job."
            )


        # ---------------------------------
        # Recommendations
        # ---------------------------------

        recommendations.append(
            "Customize the resume according to the target job description."
        )


        if not any(
            word in text_lower
            for word in [
                "experience",
                "internship",
            ]
        ):

            recommendations.append(
                "Add relevant internship, training, or practical experience when available."
            )


        recommendations.append(
            "Use measurable results and strong action words in project descriptions."
        )


        recommendations.append(
            "Keep technical skills aligned with the job requirements."
        )


        # ---------------------------------
        # Final Response
        # ---------------------------------

        return {
            "success": True,
            "analysis": {
                "strengths": strengths,
                "weaknesses": weaknesses,
                "recommendations": recommendations,
            }
        }


    except Exception as e:

        return {
            "success": False,
            "message": f"Resume analysis failed: {str(e)}"
        }
        # =========================================
# RESUME HISTORY APIs
# =========================================

@app.post("/history")
def create_history(
    data: HistoryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = ResumeHistory(
        user_id=current_user.id,
        file_name=data.file_name,
        ats_score=data.ats_score
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    return {
        "success": True,
        "history": {
            "id": history.id,
            "file_name": history.file_name,
            "ats_score": history.ats_score,
            "created_at": history.created_at.isoformat()
        }
    }


@app.get("/history")
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = (
        db.query(ResumeHistory)
        .filter(ResumeHistory.user_id == current_user.id)
        .order_by(ResumeHistory.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "history": [
            {
                "id": item.id,
                "file_name": item.file_name,
                "ats_score": item.ats_score,
                "created_at": item.created_at.isoformat()
            }
            for item in items
        ]
    }


@app.delete("/history/{history_id}")
def delete_history(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = (
        db.query(ResumeHistory)
        .filter(
            ResumeHistory.id == history_id,
            ResumeHistory.user_id == current_user.id
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="History item not found"
        )

    db.delete(item)
    db.commit()

    return {
        "success": True,
        "message": "History item deleted"
    }


@app.delete("/history")
def clear_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(ResumeHistory).filter(
        ResumeHistory.user_id == current_user.id
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "success": True,
        "message": "History cleared"
    }