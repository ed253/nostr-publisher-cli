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

### Fetch a note by ID

`nostr-publisher-cli --relay relay.nostr.band --fetch notes --note note123456789`

### Fetch comments by note

`nostr-publisher-cli --relay relay.nostr.band --fetch comments --note note123456789`

### Fetch notes by author

`nostr-publisher-cli --relay relay.nostr.band --fetch notes --author npub123456789 --since 123456789 --limit 10`

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

https://nostr-multimedia.eu-4.evennode.com/markdown/nos.lol/naddr1qqfxy6t5vdhkjm3dwa5xjar9wpshqetjqgsp6ppesc0wf3q3c3qh7g74yzytc297xdn6f66lqgv2mv03exlmcwsrqsqqqa28dd8gcl

### Upload a HTML page

`nostr-publisher-cli --relay relay.nostr.band --publish html --slug "my-webpage" --title "My Webpage" --file my_webpage.html`

View your HTML page in your browser with nostr-multimedia:

`https://nostr-multimedia.eu-4.evennode.com/html/nos.lol/naddr1qq9xummnw3ez6urpvajsygqaqsucv8hycsgugstly02jpz9u9zlrxeayad0syx9dk8cun0au8gpsgqqqw4rsz30n4m/`

Note: Currently there is no HTML page kind. Kind 30023 is used for now (so that you can edit your HTML page later). This is not optimal because it could spam blogging clients.

### Upload a file, such as an image

`nostr-publisher-cli --relay relay.nostr.band --publish file --file my_image.png`

Files are automatically converted to base64 data URIs. 

View your file in your browser with nostr-multimedia:

https://nostr-multimedia.eu-4.evennode.com/file/nos.lol/note1wqvk97jzp5nqxt79vy3rj3ts8pxp7z4sqhznh6sjj0txjjcdj28qrlp7m7/image.png

Display an image in a Nostr note using Markdown:

`![https://nostr-multimedia.eu-4.evennode.com/file/nos.lol/note1wqvk97jzp5nqxt79vy3rj3ts8pxp7z4sqhznh6sjj0txjjcdj28qrlp7m7/image.png](My image)`

Display an image on your website using HTML:

`<img src="https://nostr-multimedia.eu-4.evennode.com/file/nos.lol/note1wqvk97jzp5nqxt79vy3rj3ts8pxp7z4sqhznh6sjj0txjjcdj28qrlp7m7/image.png" alt="My image">`

Note: Currently there is no base64 file kind. Kind 1 is used for now. This is not optimal because it could spam social media clients.

Note: The max content size for Kind 1 notes is usually 64 KB.

### Delete a note

`nostr-publisher-cli --relay relay.nostr.band --publish delete --note note123456789`

Relays may or may not honor the deletion.

## Support

If you have a NIP for HTML pages or small base64 files, let me know and I'll add your note kind and parameters.

## Tips

If you like nostr-publisher-cli, tips are appreciated:

Bitcoin: ed253@coinos.io

Monero: 87vvXn5XgwHGP8YFxGDNA9LVZbAYESXpRaqNn3LR6dYgHzqJhEemN5eLXoNciR8BKUAZ32Ygc8z9UPxqmbQLZxmU4mTa81V

## License

MIT
