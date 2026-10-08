import enum


class StudentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    GRADUATED = "GRADUATED"
    SUSPENDED = "SUSPENDED"
    DROPPED = "DROPPED"


class ScopeType(str, enum.Enum):
    GLOBAL = "GLOBAL"
    DEPARTMENT = "DEPARTMENT"
    COURSE = "COURSE"


class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    PENDING_STUDENT_CONFIRMATION = "PENDING_STUDENT_CONFIRMATION"
    RESOLVED = "RESOLVED"
    NOT_SOLVED = "NOT_SOLVED"
    ESCALATED = "ESCALATED"


class SLAStatus(str, enum.Enum):
    ON_TRACK = "ON_TRACK"
    WARNING = "WARNING"
    BREACHED = "BREACHED"