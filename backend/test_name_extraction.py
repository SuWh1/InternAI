#!/usr/bin/env python3

from app.utils.email_service import email_service

def test_first_name_extraction():
    """Test the first name extraction logic."""
    test_cases = [
        ('John Doe', 'John'),
        ('jane smith', 'Jane'),
        ('MICHAEL JOHNSON', 'Michael'),
        ('Sarah', 'Sarah'),
        ('  Alice   ', 'Alice'),
        ('', 'there'),
        (None, 'there'),
        ('   ', 'there'),
        ('a', 'A'),
    ]
    
    print("Testing first name extraction:")
    print("-" * 40)
    
    for input_name, expected in test_cases:
        try:
            result = email_service._extract_first_name(input_name)
            status = "✓" if result == expected else "✗"
            print(f"{status} Input: '{input_name}' -> Expected: '{expected}', Got: '{result}'")
        except Exception as e:
            print(f"✗ Input: '{input_name}' -> Error: {e}")

if __name__ == "__main__":
    test_first_name_extraction()
