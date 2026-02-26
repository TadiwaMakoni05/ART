import requests

def test_login():
    url = "http://localhost:8000/api/auth/token/"
    creds = [
        ("dr.smith", "pass123", "provider"),
        ("jane.doe", "pass123", "patient"),
        ("admin", "admin123", "admin")
    ]

    for username, password, expected_role in creds:
        print(f"Testing login for {username}...")
        try:
            response = requests.post(url, data={"username": username, "password": password})
            if response.status_code == 200:
                data = response.json()
                role = data.get("role")
                print(f"Success! Role received: {role}")
                if role == expected_role:
                    print("Role matches expected.")
                else:
                    print(f"MISMATCH: Expected {expected_role}, got {role}")
                
                if "access" in data and "refresh" in data:
                    print("Tokens received.")
                else:
                    print("Tokens missing.")
            else:
                print(f"Failed. Status: {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"Error: {e}")
        print("-" * 20)

if __name__ == "__main__":
    test_login()
