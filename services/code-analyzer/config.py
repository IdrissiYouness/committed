import os


class Config:
    """Configuration for code analyzer service"""

    # Directory settings
    TEMP_DIR = os.getenv("TEMP_DIR", "/tmp/code-analysis")
    REPORTS_DIR = os.getenv("REPORTS_DIR", "/tmp/reports")

    # External tools
    TYPST_BIN = os.getenv("TYPST_BIN", "/usr/local/bin/typst")
    AGENT_CLI = os.getenv("AGENT_CLI", "kilo-code")

    # Agent backend configuration
    AGENT_BACKEND = os.getenv("AGENT_BACKEND", "openai")  # "kilocode" | "openai"
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

    # Timeout settings (in seconds)
    CLONE_TIMEOUT = int(os.getenv("CLONE_TIMEOUT", "120"))
    AGENT_TIMEOUT = int(os.getenv("AGENT_TIMEOUT", "300"))

    # Flask settings
    PORT = int(os.getenv("PORT", "5000"))
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # Notification service
    NOTIFICATION_SERVICE_URL = os.getenv(
        "NOTIFICATION_SERVICE_URL", "http://notifications:5001"
    )

    @classmethod
    def validate(cls):
        """Validate critical configuration"""
        if cls.AGENT_BACKEND == "openai" and not cls.OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY is required when AGENT_BACKEND is 'openai'"
            )

        # Ensure directories exist
        os.makedirs(cls.TEMP_DIR, exist_ok=True)
        os.makedirs(cls.REPORTS_DIR, exist_ok=True)
