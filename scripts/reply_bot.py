#!/usr/bin/env python3
import requests
import random
import time
import argparse
import os
import json
from datetime import datetime

EMOJIS = ["🔥", "😂", "💀", "😮‍💨", "👀", "💯", "😎", "🙌", "🤝"]

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def api_get(url, params=None, token=None):
    params = params or {}
    if token:
        params["access_token"] = token
    return requests.get(url, params=params).json()

def api_post(url, data=None, token=None):
    data = data or {}
    if token:
        data["access_token"] = token
    return requests.post(url, data=data).json()

def get_last_60_posts(page_id, token, graph_base):
    res = api_get(f"{graph_base}/{page_id}/posts", {"limit": 60, "fields": "id"}, token)
    return [p["id"] for p in res.get("data", [])]

def get_comments(post_id, token, graph_base):
    res = api_get(f"{graph_base}/{post_id}/comments", {"fields": "id,message,from", "limit": 500}, token)
    return res.get("data", [])

def already_replied(comment_id, page_id, token, graph_base):
    res = api_get(f"{graph_base}/{comment_id}/comments", {"fields": "from"}, token)
    for r in res.get("data", []):
        if r.get("from", {}).get("id") == page_id:
            return True
    return False

def reply(comment_id, token, graph_base):
    emoji = random.choice(EMOJIS)
    return api_post(f"{graph_base}/{comment_id}/comments", {"message": emoji}, token)

def run(page_id, token, graph_base, shadow=False, delay_seconds=0.4):
    stats = {"posts": 0, "comments_seen": 0, "replied": 0, "skipped": 0}

    posts = get_last_60_posts(page_id, token, graph_base)
    log(f"Fetched {len(posts)} posts/reels")

    for post in posts:
        stats['posts'] += 1
        log(f"Scanning post {stats['posts']}/{len(posts)}")

        comments = get_comments(post, token, graph_base)
        for c in comments:
            stats['comments_seen'] += 1
            cid = c["id"]

            if already_replied(cid, page_id, token, graph_base):
                stats['skipped'] += 1
                continue

            if not shadow:
                try:
                    resp = reply(cid, token, graph_base)
                    if resp:
                        stats['replied'] += 1
                except Exception as e:
                    log(f"Error replying to {cid}: {e}")
            else:
                stats['replied'] += 0

            time.sleep(delay_seconds)

    return stats

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--page-id', dest='page_id')
    parser.add_argument('--access-token', dest='access_token')
    parser.add_argument('--graph', dest='graph', default=os.environ.get('GRAPH', 'https://graph.facebook.com/v24.0'))
    parser.add_argument('--shadow', dest='shadow', action='store_true')
    args = parser.parse_args()

    page_id = args.page_id or os.environ.get('PAGE_ID')
    access_token = args.access_token or os.environ.get('ACCESS_TOKEN')
    graph = args.graph

    if not page_id or not access_token:
        print(json.dumps({"error": "page_id and access_token are required"}))
        return

    result = run(page_id, access_token, graph, shadow=args.shadow)
    print(json.dumps({"success": True, "pageId": page_id, "result": result}))

if __name__ == '__main__':
    main()
