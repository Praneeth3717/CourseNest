from app.core.enums import SessionStatusEnum, AttendanceStatus


def calculate_course_progress(course):
    completed_hours = sum(
        session.duration_hours
        for session in course.sessions
        if session.status == SessionStatusEnum.COMPLETED
    )

    progress_percentage = 0.0

    if course.duration_hours and course.duration_hours > 0:
        progress_percentage = round(
            (completed_hours / course.duration_hours) * 100,
            2,
        )
        progress_percentage = min(progress_percentage, 100.0)

    return progress_percentage, completed_hours


def calculate_student_progress(
    enrollment,
    completed_teaching_hours,
):
    attended_hours = sum(
        attendance.session.duration_hours
        for attendance in enrollment.attendance_records
        if (
            attendance.status == AttendanceStatus.PRESENT
            and attendance.session.status == SessionStatusEnum.COMPLETED
        )
    )

    if completed_teaching_hours == 0:
        return 0, attended_hours

    progress = (attended_hours / completed_teaching_hours) * 100

    return progress, attended_hours
