# Security Setup Guide

This document explains how to enable GitHub push protection and set up gitleaks for secret detection.

## 1. Enable GitHub Push Protection for Secrets

### Steps:
1. Go to your GitHub repository: https://github.com/emailaaguirre-eng/tae-full-devsite
2. Click **Settings** → **Code security and analysis**
3. Under **Secret scanning**, click **Enable** (if not already enabled)
4. Under **Push protection**, toggle **Enable push protection** to ON
5. Optionally enable **Alert on push** to get notified immediately

### What it does:
- Scans pushes for secrets before they're committed
- Blocks pushes that contain detected secrets
- Supports 200+ secret types (API keys, tokens, passwords, etc.)

### Note:
- Push protection is available for public repositories and GitHub Enterprise
- For private repos, you may need GitHub Advanced Security

## 2. Gitleaks Setup

### Option A: GitHub Action (Already Configured)

The repository includes `.github/workflows/gitleaks.yml` which:
- Runs on every push and pull request
- Scans all commits for secrets
- Fails the CI if secrets are detected
- Runs weekly on Mondays for ongoing monitoring

**Status**: ✅ Already set up - will run automatically

### Option B: Pre-commit Hook (Local Protection)

#### Installation:
```bash
# Install pre-commit
pip install pre-commit

# Or with Homebrew (Mac)
brew install pre-commit

# Install the hooks
cd tae-full-devsite
pre-commit install
```

#### What it does:
- Scans your commits **before** they're pushed
- Prevents committing secrets locally
- Runs automatically on `git commit`

#### Manual run:
```bash
# Test all files
pre-commit run --all-files

# Test staged files only
pre-commit run
```

### Option C: Manual Gitleaks Scan

#### Install gitleaks:
```bash
# Windows (with Chocolatey)
choco install gitleaks

# Or download from: https://github.com/gitleaks/gitleaks/releases
```

#### Run scan:
```bash
# Scan current repository
gitleaks detect --source . --verbose

# Scan with report
gitleaks detect --source . --report-path gitleaks-report.json
```

## 3. Configuration Files

### `.gitleaksignore`
- Lists files/patterns to ignore during scans
- Add legitimate files that might trigger false positives

### `.pre-commit-config.yaml`
- Configures pre-commit hooks
- Includes gitleaks and other useful checks

## 4. Testing the Setup

### Test GitHub Action:
1. Make a test commit with a fake secret (e.g., `API_KEY=test_1234567890abcdef`)
2. Push to a branch
3. Check the Actions tab - it should fail with gitleaks error

### Test Pre-commit Hook:
```bash
# Create a test file with a fake secret
echo "API_KEY=sk_test_1234567890abcdef" > test-secret.txt
git add test-secret.txt
git commit -m "test"  # Should be blocked by pre-commit hook
```

## 5. Best Practices

1. **Never commit secrets** - Use environment variables or secret managers
2. **Use `.env.example`** - Template files with placeholder values
3. **Rotate immediately** - If a secret is exposed, rotate it right away
4. **Review false positives** - Add legitimate patterns to `.gitleaksignore`
5. **Keep gitleaks updated** - Update the version in `.pre-commit-config.yaml` regularly

## 6. Troubleshooting

### Pre-commit not running:
```bash
# Reinstall hooks
pre-commit uninstall
pre-commit install
```

### GitHub Action not running:
- Check repository Settings → Actions → General
- Ensure "Allow all actions and reusable workflows" is enabled

### False positives:
- Add patterns to `.gitleaksignore`
- Or use inline comments: `# gitleaks:allow`

## Resources

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Pre-commit Documentation](https://pre-commit.com/)

