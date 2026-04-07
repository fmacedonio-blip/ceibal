from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    sub = Column(String, unique=True, nullable=True, index=True)  # JWT sub claim
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # docente | alumno | director | inspector
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    courses = relationship("Course", back_populates="teacher")
    alerts = relationship("Alert", back_populates="teacher")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)   # e.g. "4to A"
    shift = Column(String, nullable=False)  # e.g. "Turno Matutino"
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    teacher = relationship("User", back_populates="courses")
    students = relationship("Student", back_populates="course")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    average = Column(Float, nullable=False, default=0.0)
    tasks_completed = Column(Integer, nullable=False, default=0)
    tasks_total = Column(Integer, nullable=False, default=0)
    last_activity = Column(String, nullable=True)
    status = Column(String, nullable=False, default="al_dia")  # al_dia | pendiente

    course = relationship("Course", back_populates="students")
    activities = relationship("Activity", back_populates="student")
    ai_diagnosis = relationship("AiDiagnosis", back_populates="student", uselist=False)


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    score = Column(Float, nullable=True)
    status = Column(String, nullable=False)  # COMPLETADA | PENDIENTE_DE_REVISION | REVISADA | NO_ENTREGADO | CORREGIDA

    student = relationship("Student", back_populates="activities")


class AiDiagnosis(Base):
    __tablename__ = "ai_diagnoses"
    __table_args__ = (UniqueConstraint("student_id"),)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    text = Column(Text, nullable=False)
    tags = Column(JSON, nullable=False, default=list)

    student = relationship("Student", back_populates="ai_diagnosis")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)      # difficulty | pending | suggestion
    severity = Column(String, nullable=False)  # high | medium | low
    message = Column(String, nullable=False)

    teacher = relationship("User", back_populates="alerts")
