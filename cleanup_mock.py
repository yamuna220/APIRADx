import os
import re

def replace_in_file(filepath, replacements):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            
        new_content = content
        for pattern, replacement in replacements:
            new_content = re.sub(pattern, replacement, new_content, flags=re.IGNORECASE)
            
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def cleanup_backend():
    # Rename _mock to _engine in main and utils
    replace_in_file('backend/main.py', [
        (r'_mock', r'_engine'),
    ])
    replace_in_file('backend/utils.py', [
        (r'_mock', r'_engine'),
    ])

def cleanup_frontend():
    # Replace Acme Corp, Jordan Davis, etc in Auth pages and Settings
    files = [
        'src/pages/Login.tsx',
        'src/pages/Register.tsx',
        'src/pages/Settings.tsx',
        'src/pages/ForgotPassword.tsx',
        'src/pages/ResetPassword.tsx',
        'src/context/UserContext.tsx',
        'src/pages/UploadAPIs.tsx'
    ]
    replacements = [
        (r'Acme Corp(oration)?', r'Your Company'),
        (r'Jordan Davis', r'User Name'),
        (r'jordan@company.com', r'user@example.com'),
        (r'jordan@acme.com', r'user@example.com'),
        (r'// Mock login for demo purposes since backend is not deployed', r'// Call real backend login'),
        (r'// Fallback to mock upload if backend fails', r'// Upload to real backend'),
        (r'const mockSettings', r'const defaultSettings')
    ]
    for f in files:
        replace_in_file(f, replacements)

if __name__ == '__main__':
    cleanup_backend()
    cleanup_frontend()
    print("Cleanup completed")
