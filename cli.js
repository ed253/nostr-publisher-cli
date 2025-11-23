#!/usr/bin/env node

import minimist from "minimist"
import mime from "mime";
import TLV from "node-tlv";
import * as secp from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { bech32 } from "@scure/base";
import { readFileSync } from "fs";
import { fileTypeFromBuffer } from "file-type";
import { WebSocket } from "ws";

secp.hashes.sha256 = sha256;

function randomKey() {
 
  var { secretKey, publicKey } = secp.schnorr.keygen();

  var keys = {
    publicKey: secp.etc.bytesToHex(publicKey),
    privateKey: secp.etc.bytesToHex(secretKey),
  }

  return keys;

}

function getKeyFromConf() {
 
  try {
    var fileContents = readFileSync("nostr-publisher-cli.conf");
  } catch(err) {
    var fileContents = {};
  }

  var json = JSON.parse(fileContents);

  if(json.key) {
    return json.key;
  } else {
    return "";
  }

}

function getPublicKey(privateKey) {

  var privateKeyBytes = secp.etc.hexToBytes(privateKey);
  
  var publicKeyBytes = secp.schnorr.getPublicKey(privateKeyBytes);

  var publicKey = secp.etc.bytesToHex(publicKeyBytes);
  
  return publicKey;

}

async function signNote(event, privateKey) {
 
  if(!privateKey) {
    return [];
  }

  var isHashed = event.id ? true : false;

  if(!isHashed) {

    var eventJSON = JSON.stringify([
      0,
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content,
    ]);

    var eventSerialized = new TextEncoder().encode(eventJSON);
 
    var eventHashBytes = await secp.hashes.sha256(eventSerialized);
 
    var eventHash = secp.etc.bytesToHex(eventHashBytes);

    event.id = eventHash;

  }

  var signatureBytes = await secp.schnorr.sign(
    secp.etc.hexToBytes(event.id),
    secp.etc.hexToBytes(privateKey)
  );

  var signature = secp.etc.bytesToHex(signatureBytes);

  event.sig = signature;

  return event;

}

async function verifyNote(event) {

  try {
    var isValid = await secp.schnorr.verify(
      secp.etc.hexToBytes(event.sig),
      secp.etc.hexToBytes(event.id),
      secp.etc.hexToBytes(event.pubkey)
    );
  } catch(err) {
    var isValid = false;
  }

  return isValid;

}

function bech32ToHex(noteId) {

  var hexRegex = /^([0-9a-f]){64}$/;
 
  if(hexRegex.test(noteId)) {
    return noteId;
  }

  var bech32Regex = /^(npub|nsec|note|nevent|naddr|nprofile|nrelay){1}([a-z0-9]*)$/;
 
  if(!bech32Regex.test(noteId)) {
    return noteId;
  }

  var decoded = bech32.decode(noteId, 1000);
  var bytes = new Uint8Array(bech32.fromWords(decoded.words));
  var hex = Buffer.from(bytes).toString("hex");
  
  if(["nevent","naddr","nprofile"].includes(decoded.prefix)) {

    var nip19 = {};

    var tlvParts = TLV.parseList(hex);

    for(var part of tlvParts) {
     
      if(part.tag == "00") {
        if(decoded.prefix == "naddr") {
          nip19.d = Buffer.from(part.value, "hex").toString("utf8");
        } else {
          nip19.id = part.value.toLowerCase();
        }
      }

      if(part.tag == "01") {
        nip19.relay = Buffer.from(part.value, "hex").toString("utf8");
      }

      if(part.tag == "02") {
        nip19.author = part.value.toLowerCase();
      }

      if(part.tag == "03") {
        nip19.kind = Buffer.from(part.value, "hex").readUIntBE(0,4);
      }

    }

    if(nip19.id) {
      var hex = nip19.id;
    }

    if(nip19.d) {
      var hex = nip19.author+""+nip19.d;
    }

  }

  return hex;

}


function hexToBech32(params) {

  if(!["nevent","naddr","nprofile"].includes(params.prefix)) {
 
    var bytes = Buffer.from(params.hex, "hex");

  }
  
  if(["nevent","naddr","nprofile"].includes(params.prefix)) {

    var nip19 = "";

    if(params.prefix == "naddr") {

      var dtag = Buffer.from(params.slug, "utf8").toString("hex");
      var nip19 = nip19 + "" + (new TLV("00", dtag));

    } else {

      var note = params.hex.toUpperCase();
      var nip19 = nip19 + "" + (new TLV("00", hex));

    }

    if(params.relay) {
      var relay = Buffer.from(params.relay, "utf8").toString("hex");
      var nip19 = nip19 + "" + (new TLV("01", relay));
    }

    if(params.author) {
      var author = params.author.toUpperCase();
      var nip19 = nip19 + "" + (new TLV("02", author));
    }

    if(params.kind) {
      var buf = Buffer.alloc(4);
      buf.writeUIntBE(params.kind, 0, 4);
      var kind = buf.toString("hex");
      var nip19 = nip19 + "" + (new TLV("03", kind));
    }

    var bytes = Buffer.from(nip19, "hex");

  }

  var words = bech32.toWords(bytes);

  var bech32Address = bech32.encode(params.prefix, words, 1000);

  return bech32Address;

}

function fileToUTF8(filename) {

  try {
    var fileContents = readFileSync(filename);
  } catch(err) {
    var fileContents = Buffer.from([]);
  }

  var utf8 = fileContents.toString("utf8");

  return utf8;

}

async function fileToBase64(filename) {

  try {
    var fileContents = readFileSync(filename);
  } catch(err) {
    var fileContents = Buffer.from([]);
  }
 
  var base64 = fileContents.toString("base64");

  var fileType = await fileTypeFromBuffer(fileContents);

  if(fileType) {
    var mimeType = fileType.mime;
  }

  if(!fileType) {
    var mimeType = mime.getType(filename);
  }

  if(!mimeType) {
    var mimeType = "application/octet-stream";
  }

  var dataURI = `data:${mimeType};base64,${base64}`;

  return dataURI;

}

function constructQuery(params) {

  var query = [];

  if(params.fetch == "raw") {
    return JSON.parse(params.query);
  }

  if(params.fetch == "note") {
 
    var noteId = bech32ToHex(params.note);
 
    if(!noteId) {
      return [];
    }

    if(params.note.slice(0,5) == "naddr") {
      var filter = { "authors": [noteId.slice(0,64)], "#d": [noteId.slice(64)], "limit": 1 };
    }

    if(params.note.slice(0,5) != "naddr") {
      var filter = { "ids": [noteId], "limit": 1 };
    }

    var query = ["REQ", "fetchNote", filter];

  }

  if(params.fetch == "comments") {

    var noteId = bech32ToHex(params.note);

    if(!noteId) {
      return [];
    }

    var filter = { "#e": [noteId], "limit": 100 };

    var query = ["REQ", "fetchComments", filter];

  }

  if(params.fetch == "author") {

    var pubKey = bech32ToHex(params.author);

    if(!pubKey) {
      return [];
    }

    var filter = { "authors": [pubKey], "limit": 100 };

    if(params.limit) {
      filter.limit = params.limit;
    }

    if(params.since) {
      filter.since = params.since;
    }

    var query = ["REQ", "fetchNotesByAuthor", filter];

  }

  if(params.fetch == "search") {

    var searchTerms = params.terms;

    if(!searchTerms) {
      return [];
    }
    
    var filter = { "search": searchTerms, "limit": 100 };

    if(params.limit) {
      filter.limit = params.limit;
    }

    if(params.since) {
      filter.since = params.since;
    }

    var query = ["REQ", "fetchNotesBySearchTerms", filter];

  }

  return query;
  
}

async function constructNote(params) {

  if(params.publish == "raw") {

    var query = JSON.parse(params.content);
  
    var event = query[1];

    if(!event.sig) {
      var event = await signNote(event, params.key);
    }

    query[1] = event;
    
    return query;

  }

  var event = {
    "id": 0,
    "pubkey": getPublicKey(params.key),
    "created_at": Math.floor(Date.now() / 1000),
    "kind": 1,
    "tags": [],
    "content": "",
  };

  if(params.publish == "text") {

    event.kind = 1;
    
    if(params.content) {
      event.content = params.content;
    }

    if(params.file) {
      event.content = fileToUTF8(params.file);
    }

  }

  if(params.publish == "comment") {

    event.kind = 1;
    
    event.tags = ["e", params.note];

    if(params.content) {
      event.content = params.content;
    }

    if(params.file) {
      event.content = fileToUTF8(params.file);
    }

  }

  if(params.publish == "article") {

    event.kind = 30023;

    event.tags = [
      ["d", params.slug],
      ["title", params.title],
      ["published_at", ""+Math.floor(Date.now() / 1000)],
    ];

    event.content = fileToUTF8(params.file);

  }

  if(params.publish == "html") {

    event.kind = 30023;

    event.tags = [
      ["d", params.slug],
      ["title", params.title],
      ["published_at", ""+Math.floor(Date.now() / 1000)],
    ];

    event.content = fileToUTF8(params.file);

  }

  if(params.publish == "file") {

    event.kind = 1;

    event.content = await fileToBase64(params.file);

  }

  if(params.publish == "delete") {

    event.kind = 5;

    event.tags = [["#e", bech32ToHex(params.note)]];

    event.content = "Request to delete";

  }

  var event = await signNote(event, params.key);

  var query = ["EVENT", event];

  return query;

}

async function sendToRelay(relay, query) {
     
  try {
    var relay = "wss://"+relay;
    var validUrl = new URL(relay);
  } catch(err) {
    var relay = false;
  }

  if(!relay || !query) {
    return [];
  }

  var notes = await askNostr(relay, query);
  
  return notes;

}

function askNostr(relay, query) {

  return new Promise((resolve, reject) => {

    if(!relay || !query) {
      resolve([]);
    }

    var buffer = [];

    var ws = new WebSocket(relay);

    ws.on("open", function() {
      ws.send(
        JSON.stringify(query)
      );
    });

    ws.on("message", function(data) {
        
      var data = JSON.parse(data);

      var type = data[0];

      if(type == "EVENT" || type == "OK" || type == "NOTICE") {
        buffer.push(data);
      }
      
      if(type == "OK" || type == "NOTICE" || type == "EOSE") {

        if(query[0] == "REQ") {
          var closeSubscription = query[1];
        } else {
          var closeSubscription = "EVENT";
        }

        ws.send(
          JSON.stringify(["CLOSE", closeSubscription])
        );

      };

      if(type == "OK" || type == "NOTICE" || type == "EOSE" || type == "CLOSED") {
        ws.close();
      };

    });

    ws.on("close", function() {
      resolve(buffer);
    });

    ws.on("error", function(err) {
      console.log(err);
      resolve(buffer);
    });

  });

}

async function processCommand() {

  var params = minimist(process.argv.slice(2));

  if(params.key) {
    params.key = bech32ToHex(params.key);
  } else {
    params.key = bech32ToHex(getKeyFromConf());
  }

  if(params["random-key"]) {
    return randomKey();
  }

  if(params["bech32"]) {
    return hexToBech32(params);
  }

  if(params.verify) {
    var verified = await verifyNote(JSON.parse(params.verify));
    return JSON.stringify(verified);
  }

  if(params.sign) {
    var signed = await signNote(JSON.parse(params.sign), params.key);
    return JSON.stringify(signed);
  }

  if(params.fetch) {
    var query = constructQuery(params);
  }

  if(params.publish) {
    var query = await constructNote(params);
  }

  if(params["dry-run"]) {
    var result = query;
  }

  if(!params["dry-run"]) {
    var result = await sendToRelay(params.relay, query);
  }

  return JSON.stringify(result);

}

var result = await processCommand();
console.log(result);
