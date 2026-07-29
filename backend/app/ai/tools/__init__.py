from app.ai.tools.profile import get_student_profile
from app.ai.tools.courses import (
    search_courses,
    get_course_details,
)
from app.ai.tools.enrollments import (
    list_my_enrollments,
    get_enrollment_progress,
)

from app.ai.tools.sessions import (
    list_my_sessions,
    get_session_details,
)

from app.ai.tools.attendance import (
    list_my_attendance,
    get_attendance_summary,
)

chat_tools = [
    get_student_profile,
    search_courses,
    get_course_details,
    list_my_enrollments,
    get_enrollment_progress,
    list_my_sessions,
    get_session_details,
    list_my_attendance,
    get_attendance_summary,
]
