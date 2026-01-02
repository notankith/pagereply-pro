import requests
import random
import time
import sys

ACCESS_TOKEN = "EAAMVrwZBedl8BQTkidnKipCIUOCTvbqNl667Wtt11oqsUCSVWuymoaqRdhOaHOwYEllUWbWfXmmr0MWdSsoVbpZAllzasgZB6Ay8yDRjhbUZCp6Di2c7LcUoSkCjL8859mkah9Tn6UuAZA8OxvX0uGiG4pFXZCW87OYTnbNLNoh5LZCpvA0GiQQZALoNT2E1Ogy6IPysZCZByYdFVRb5UaZCxvtoVb6iXMujfSUkZCT90DzgPgZDZD"
PAGE_ID = "123872034331112"
GRAPH = "https://graph.facebook.com/v24.0"

EMOJIS = ["🔥", "❤️", "😂", "😍", "🙌", "💯", "👏", "😎", "✨"]

stats = {
    "checked": 0,
    "replied": 0,
    "skipped": 0,
    "errors": 0
}


def get_comments(object_id, object_type):
    if object_type == "reel":
        endpoint = f"{GRAPH}/{object_id}/comments"
    elif object_type == "post":
        endpoint = f"{GRAPH}/{object_id}/comments"
    else:
        print("❌ Invalid type.")
        return []

    params = {
        "access_token": ACCESS_TOKEN,
        "filter": "stream",
        "fields": "id,from,comments.limit(10){from}",
        "limit": 100
    }

    res = requests.get(endpoint, params=params).json()

    if "error" in res:
        print("❌ API ERROR:", res["error"])
        return []

    return res.get("data", [])


def already_replied(comment):
    for r in comment.get("comments", {}).get("data", []):
        if r.get("from", {}).get("id") == PAGE_ID:
            return True
    return False


def reply_to_comment(comment_id):
    url = f"{GRAPH}/{comment_id}/comments"
    payload = {
        "access_token": ACCESS_TOKEN,
        "message": random.choice(EMOJIS)
    }
    res = requests.post(url, data=payload)
    return res.status_code == 200


def process_object(object_id, object_type):
    print("\n==============================")
    print(f"🎯 TYPE: {object_type.upper()}")
    print(f"🔗 https://www.facebook.com/{object_id}")
    print("==============================")

    comments = get_comments(object_id, object_type)
    print(f"🧠 Comments found: {len(comments)}\n")

    for c in comments:
        stats["checked"] += 1
        cid = c["id"]
        link = f"https://www.facebook.com/{cid}"

        if already_replied(c):
            stats["skipped"] += 1
            print(f"⏭️  Skipped → {link}")
            continue

        ok = reply_to_comment(cid)

        if ok:
            stats["replied"] += 1
            print(f"✅ Replied → {link}")
        else:
            stats["errors"] += 1
            print(f"❌ Failed → {link}")

        time.sleep(1.5)

    print("\n📊 STATS")
    print(f"Checked : {stats['checked']}")
    print(f"Replied : {stats['replied']}")
    print(f"Skipped : {stats['skipped']}")
    print(f"Errors  : {stats['errors']}")
    print("------------------------------")


def main():
    print("🚀 FB COMMENT BOT — SMART MODE")

    while True:
        mode = input("\nType 'reel' or 'post' (or 'exit'): ").strip().lower()
        if mode == "exit":
            print("Done. Touch grass.")
            break

        if mode not in ["reel", "post"]:
            print("❌ Invalid option.")
            continue

        object_id = input("Paste ID: ").strip()
        process_object(object_id, mode)


if __name__ == "__main__":
    main()
