# nostr-publisher-cli

Fetch and publish notes from Nostr using the commandline

Compatible with [nostr-multimedia](https://github.com/ed253/nostr-multimedia) to view notes, HTML pages and files in your browser without JavaScript or Websockets.

## Installation

`npm install --global ed253/nostr-publisher-cli`

## Usage

- To publish a note, use `--key xxxxx` or set `{ "key": "xxxxx" }` in nostr-publisher-cli.conf
- Use `--dry-run` to return the event JSON, without broadcasting it to a relay

### Generate a random key

`nostr-publisher-cli --random-key`

Returns:

`{ "publicKey": "xxxxx", "privateKey": "xxxxx" }`

### Submit a raw request

`nostr-publisher-cli --relay relay.nostr.band --fetch raw --content '[REQ, "MyQuery", { "ids": "[...]" }]'`

Returns:

`[["EVENT","MyQuery",{"id":"xxxxx","kind":1,"pubkey":"xxxxx","tags":[],"created_at":123456789,"content":"My Post","sig":"xxxxx"}]]`

### Submit a raw event

`nostr-publisher-cli --relay relay.nostr.band --publish raw --content '["EVENT", { "id": "xxxxx", "kind": 1, "pubkey": "xxxxx", "tags": ["#e", "testing"], "content": "Hello world", "created_at": 123456789, "sig": "xxxxx" }]'`

Returns:

`[["OK","xxxxx",true,""]]`

### Hash and sign event JSON

`nostr-publisher-cli --sign '{ "id": 0, "kind": 1, "pubkey": "xxxxx", "tags": ["#e", "testing"], "content": "Hello world", "created_at": 123456789 }' --key xxxxx`

Returns:

The signed event (not broadcasted)

### Verify event JSON

`nostr-publisher-cli --verify '{ "id": "xxxxx", "kind": 1, "pubkey": "xxxxx", "tags": ["#e", "testing"], "content": "Hello world", "created_at": 123456789, "sig": "xxxxx" }'`

Returns:

`true/false`

### Generate a bech32 address

`nostr-publisher-cli --bech32 --prefix note --hex xxxxx`

Or

`nostr-publisher-cli --bech32 --prefix naddr --author xxxxx --slug "my-blog-post" --kind 30023`

### Resolve a NIP-05 username

`nostr-publisher-cli --nip05 bob@example.com`

Returns:

`npub in hex format`

### Fetch a note by ID

`nostr-publisher-cli --relay relay.nostr.band --fetch notes --note note123456789`

### Fetch comments by note

`nostr-publisher-cli --relay relay.nostr.band --fetch comments --note note123456789`

### Fetch notes by author

`nostr-publisher-cli --relay relay.nostr.band --fetch notes --author npub123456789 --since 10000000 --until 123456789 --limit 10`

### Fetch notes by search terms

`nostr-publisher-cli --relay relay.nostr.band --fetch search --terms "Bitcoin News" --limit 50`

Note: Not all relays support search.

### Publish a text note (Kind 1)

`nostr-publisher-cli --relay relay.nostr.band --publish text --content "Hello world"`

Or

`nostr-publisher-cli --relay relay.nostr.band --publish text --file my_post.txt`

### Publish a comment (Kind 1, #e tag)

`nostr-publisher-cli --relay relay.nostr.band --publish comment --note note123456789 --content "Thanks"`

### Publish a long form post (Kind 30023)

`nostr-publisher-cli --relay relay.nostr.band --publish article --slug "my-blog-post" --title "My Blog Post" --file blog_post.md`

View your article in your browser with nostr-multimedia:

https://nostr-multimedia.netlify.com/markdown/nos.lol/naddr1qqfxy6t5vdhkjm3dwa5xjar9wpshqetjqgsp6ppesc0wf3q3c3qh7g74yzytc297xdn6f66lqgv2mv03exlmcwsrqsqqqa28dd8gcl

### Upload a static website, HTML page, image or file

`nostr-publisher-cli --relay relay.nostr.band --publish web --file my_webpage.html`

Or

`nostr-publisher-cli --relay relay.nostr.band --publish web --file logo.png`

If you want to publish all files in a directory:

`find /var/www/nostr/ -type f -maxdepth 1 -exec nostr-publisher-cli --relay relay.nostr.band --publish web --file {} \;`

View your webpage in your browser with nostr-multimedia:

https://nostr-multimedia.netlify.com/web/nos.lol/ed253@nostrcheck.me/test.html

Or

https://nostr-multimedia.netlify.com/web/nos.lol/ed253@nostrcheck.me/logo.png

**Kind 30080**

Kind 30080 is an experimental kind for static websites

It looks like

`["EVENT",{"id":"xxxx","pubkey":"xxxx","created_at":100000000,"kind":30080,"tags":[["d","test.html"],["published_at","100000000"]],"content":"data:text/html;base64,PGh0bWw+CiAgPGhlYWQ+[...]PC9odG1sPg==","sig":"xxxx"}]`

- Replaceable addressable event, only the newest file is saved
- `content` must be the Data URI of the HTML/image/CSS/JS file (must be base64-encoded and include the mime type)
- `content` may be any length, but relays generally limit content to 64 KB
- The `d tag` must be the file name
- Other tags are optional, e.g. `tags` to describe the content

With a shorter URL and default relay, Nostr webpages could look something like: https://nostr.site/bob@nostr.me/projects.html

You can view Kind 30080 with [nostr-multimedia](https://github.com/ed253/nostr-multimedia)

Not all relays accept arbitrary kinds, but nos.lol works for now

### Delete a note

`nostr-publisher-cli --relay relay.nostr.band --publish delete --note note123456789`

Relays may or may not honor the deletion.

## Tips

If you like nostr-publisher-cli, tips are appreciated:

Bitcoin: ed253@coinos.io

Monero: 87vvXn5XgwHGP8YFxGDNA9LVZbAYESXpRaqNn3LR6dYgHzqJhEemN5eLXoNciR8BKUAZ32Ygc8z9UPxqmbQLZxmU4mTa81V

## License

MIT
