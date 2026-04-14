"""Tests for git_handler module"""

import pytest
from unittest.mock import patch, MagicMock
from core import git_handler


class TestValidateUrl:
    """Tests for URL validation"""

    def test_valid_github_url(self):
        """Should accept valid GitHub URLs"""
        url = "https://github.com/user/repo"
        git_handler.validate_url(url)  # Should not raise

    def test_valid_gitlab_url(self):
        """Should accept valid GitLab URLs"""
        url = "https://gitlab.com/user/repo"
        git_handler.validate_url(url)  # Should not raise

    def test_invalid_host(self):
        """Should reject URLs from hosts not in the allow-list"""
        with pytest.raises(ValueError, match="must start with one of"):
            git_handler.validate_url("https://bitbucket.org/user/repo")

    def test_malformed_url(self):
        """Should reject malformed URLs"""
        with pytest.raises(ValueError, match="does not look like a valid repo"):
            git_handler.validate_url("https://github.com/invalid")


class TestClone:
    """Tests for repository cloning"""

    @patch("core.git_handler.subprocess.run")
    def test_successful_clone(self, mock_run):
        """Should successfully clone a repository"""
        mock_run.return_value = MagicMock(returncode=0, stderr="")

        result = git_handler.clone("https://github.com/user/repo", 123)

        assert "sub_123" in result
        mock_run.assert_called_once()

    @patch("core.git_handler.subprocess.run")
    def test_clone_failure(self, mock_run):
        """Should raise error on clone failure"""
        mock_run.return_value = MagicMock(returncode=1, stderr="Error")

        with pytest.raises(RuntimeError, match="Git clone failed"):
            git_handler.clone("https://github.com/user/repo", 123)
