import json
import urllib.request
import os
import re

# Setup paths and header
API_KEY = "YOUR_API_KEY_HERE"
PROJECT_ID = "16257523472137768172"
BASE_URL = f"https://stitch.googleapis.com/v1/projects/{PROJECT_ID}"
HEADERS = {"X-Goog-Api-Key": API_KEY}

def download_url(url, dest_path):
    print(f"Downloading to {dest_path}...")
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            with open(dest_path, 'wb') as f:
                f.write(response.read())
        print(f"Successfully downloaded {dest_path}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

def sanitize_filename(name):
    # Remove invalid characters and replace spaces
    return re.sub(r'[\\/*?:"<>|]', "", name).replace(" ", "_")

def main():
    # Ensure folders exist
    os.makedirs("assets", exist_ok=True)
    os.makedirs("code", exist_ok=True)

    # Load project json (already downloaded)
    if os.path.exists("project.json"):
        with open("project.json", "r", encoding="utf-8") as f:
            project_data = json.load(f)
    else:
        # Fetch if not present
        req = urllib.request.Request(BASE_URL, headers=HEADERS)
        with urllib.request.urlopen(req) as r:
            project_data = json.loads(r.read().decode('utf-8'))
            with open("project.json", "w", encoding="utf-8") as f:
                json.dump(project_data, f, indent=2)

    # Save Design System MD
    design_md = project_data.get("designTheme", {}).get("designMd")
    if design_md:
        with open("DESIGN.md", "w", encoding="utf-8") as f:
            f.write(design_md)
        print("Saved DESIGN.md")

    # List of screen IDs from user request
    screens = [
        {"id": "bd3a12192b33457caba38b4d7e18960f", "name_hint": "Kisan_Alert_Logo"},
        {"id": "f6ac8bf8ed6b4a54ba56bb34892b0230", "name_hint": "MP_Overview"},
        {"id": "c734df2103364b538ecfb3784f8e18a8", "name_hint": "Officer_Overview"},
        {"id": "f85fc3f46c0342cca4f83480cd648fb4", "name_hint": "Block_Detail"},
        {"id": "da88a9d190284ce19372531f490fed7e", "name_hint": "MP_Overview_Mobile"},
        {"id": "d8bbaf8ae9494faba98360ba54a139c5", "name_hint": "Interventions_Log"}
    ]

    for screen_info in screens:
        screen_id = screen_info["id"]
        url = f"{BASE_URL}/screens/{screen_id}"
        print(f"Fetching screen {screen_id} metadata...")
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req) as r:
                screen_data = json.loads(r.read().decode('utf-8'))
        except Exception as e:
            print(f"Failed to fetch screen {screen_id}: {e}")
            continue

        title = screen_data.get("title", screen_info["name_hint"])
        safe_title = sanitize_filename(title)

        # Download screenshot
        screenshot = screen_data.get("screenshot", {})
        if screenshot and screenshot.get("downloadUrl"):
            img_url = screenshot["downloadUrl"]
            download_url(img_url, f"assets/{safe_title}.png")
        else:
            print(f"No screenshot for {title}")

        # Download HTML code
        html_code = screen_data.get("htmlCode", {})
        if html_code and html_code.get("downloadUrl"):
            code_url = html_code["downloadUrl"]
            download_url(code_url, f"code/{safe_title}.html")
        else:
            print(f"No HTML code for {title}")

    # Cleanup temp files if any
    for temp_file in ["project.json", "asset_test", "asset_test2"]:
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception as e:
                print(f"Failed to remove {temp_file}: {e}")

if __name__ == "__main__":
    main()
