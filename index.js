const shiki = require('shiki');

async function main() {
    const highlighter = await shiki.getHighlighter({ theme: 'dark-plus' })
    await highlighter.loadLanguage({
        id: "http",
        scopeName: 'source.http',
        grammar: {
            "scopeName": "source.http",
            "fileTypes": [
                "http",
                "rest"
            ],
            "keyEquivalent": "^~H",
            "name": "http",
            "patterns": [
                {
                    "begin": "^\\s*(?=curl)",
                    "name": "http.request.curl",
                    "end": "^\\s*(\\#{3,}.*?)?\\s*$",
                    "endCaptures": {
                        "0": {
                            "name": "comment.line.sharp.http"
                        }
                    },
                    "patterns": [
                        {
                            "include": "source.shell"
                        }
                    ]
                },
                {
                    "begin": "\\s*(?=(\\[|{[^{]))",
                    "name": "http.request.body.json",
                    "end": "^\\s*(\\#{3,}.*?)?\\s*$",
                    "endCaptures": {
                        "0": {
                            "name": "comment.line.sharp.http"
                        }
                    },
                    "patterns": [
                        {
                            "include": "source.json"
                        }
                    ]
                },
                {
                    "begin": "^\\s*(?=<\\S)",
                    "name": "http.request.body.xml",
                    "end": "^\\s*(\\#{3,}.*?)?\\s*$",
                    "endCaptures": {
                        "0": {
                            "name": "comment.line.sharp.http"
                        }
                    },
                    "patterns": [
                        {
                            "include": "text.xml"
                        }
                    ]
                },
                {
                    "begin": "\\s*(?=(query|mutation))",
                    "name": "http.request.body.graphql",
                    "end": "^\\s*(\\#{3,}.*?)?\\s*$",
                    "endCaptures": {
                        "0": {
                            "name": "comment.line.sharp.http"
                        }
                    },
                    "patterns": [
                        {
                            "include": "source.graphql"
                        }
                    ]
                },
                {
                    "begin": "\\s*(?=(query|mutation))",
                    "name": "http.request.body.graphql",
                    "end": "^\\{\\s*$",
                    "patterns": [
                        {
                            "include": "source.graphql"
                        }
                    ]
                },
                {
                    "include": "#metadata"
                },
                {
                    "include": "#comments"
                },
                {
                    "captures": {
                        "1": {
                            "name": "keyword.other.http"
                        },
                        "2": {
                            "name": "variable.other.http"
                        },
                        "3": {
                            "name": "string.other.http"
                        }
                    },
                    "match": "^\\s*(@)([^\\s=]+)\\s*=\\s*(.*?)\\s*$",
                    "name": "http.filevariable"
                },
                {
                    "captures": {
                        "1": {
                            "name": "keyword.operator.http"
                        },
                        "2": {
                            "name": "variable.other.http"
                        },
                        "3": {
                            "name": "string.other.http"
                        }
                    },
                    "match": "^\\s*(\\?|&)([^=\\s]+)=(.*)$",
                    "name": "http.query"
                },
                {
                    "captures": {
                        "1": {
                            "name": "entity.name.tag.http"
                        },
                        "2": {
                            "name": "keyword.other.http"
                        },
                        "3": {
                            "name": "string.other.http"
                        }
                    },
                    "match": "^([\\w\\-]+)\\s*(\\:)\\s*([^\/].*?)\\s*$",
                    "name": "http.headers"
                },
                {
                    "include": "#request-line"
                },
                {
                    "include": "#response-line"
                }
            ],
            "repository": {
                "metadata": {
                    "patterns": [
                        {
                            "match": "^\\s*\\#{1,}\\s+(?:((@)name)\\s+([^\\s\\.]+))$",
                            "captures": {
                                "1": {
                                    "name": "entity.other.attribute-name"
                                },
                                "2": {
                                    "name": "punctuation.definition.block.tag.metadata"
                                },
                                "3": {
                                    "name": "entity.name.type.http"
                                }
                            },
                            "name": "comment.line.sharp.http"
                        },
                        {
                            "match": "^\\s*\\/{2,}\\s+(?:((@)name)\\s+([^\\s\\.]+))$",
                            "captures": {
                                "1": {
                                    "name": "entity.other.attribute-name"
                                },
                                "2": {
                                    "name": "punctuation.definition.block.tag.metadata"
                                },
                                "3": {
                                    "name": "entity.name.type.http"
                                }
                            },
                            "name": "comment.line.double-slash.http"
                        },
                        {
                            "match": "^\\s*\\#{1,}\\s+((@)note)\\s*$",
                            "captures": {
                                "1": {
                                    "name": "entity.other.attribute-name"
                                },
                                "2": {
                                    "name": "punctuation.definition.block.tag.metadata"
                                }
                            },
                            "name": "comment.line.sharp.http"
                        },
                        {
                            "match": "^\\s*\\/{2,}\\s+((@)note)\\s*$",
                            "captures": {
                                "1": {
                                    "name": "entity.other.attribute-name"
                                },
                                "2": {
                                    "name": "punctuation.definition.block.tag.metadata"
                                }
                            },
                            "name": "comment.line.double-slash.http"
                        },
                        {
                            "match": "^\\s*\\#{1,}\\s+(?:((@)prompt)\\s+([^\\s]+)(?:\\s+(.*))?\\s*)$",
                            "captures": {
                                "1": {
                                    "name": "entity.other.attribute-name"
                                },
                                "2": {
                                    "name": "punctuation.definition.block.tag.metadata"
                                },
                                "3": {
                                    "name": "variable.other.http"
                                },
                                "4": {
                                    "name": "string.other.http"
                                }
                            },
                            "name": "comment.line.sharp.http"
                        },
                        {
                            "match": "^\\s*\\/{2,}\\s+(?:((@)prompt)\\s+([^\\s]+)(?:\\s+(.*))?\\s*)$",
                            "captures": {
                                "1": {
                                    "name": "entity.other.attribute-name"
                                },
                                "2": {
                                    "name": "punctuation.definition.block.tag.metadata"
                                },
                                "3": {
                                    "name": "variable.other.http"
                                },
                                "4": {
                                    "name": "string.other.http"
                                }
                            },
                            "name": "comment.line.double-slash.http"
                        }
                    ]
                },
                "comments": {
                    "patterns": [
                        {
                            "match": "^\\s*\\#{1,}.*$",
                            "name": "comment.line.sharp.http"
                        },
                        {
                            "match": "^\\s*\\/{2,}.*$",
                            "name": "comment.line.double-slash.http"
                        }
                    ]
                },
                "request-line": {
                    "captures": {
                        "1": {
                            "name": "keyword.control.http"
                        },
                        "2": {
                            "name": "const.language.http"
                        },
                        "3": {
                            "patterns": [
                                {
                                    "include": "#protocol"
                                }
                            ]
                        }
                    },
                    "match": "(?i)^(?:(get|post|put|delete|patch|head|options|connect|trace)\\s+)?\\s*(.+?)(?:\\s+(HTTP\\/\\S+))?$",
                    "name": "http.requestline"
                },
                "response-line": {
                    "captures": {
                        "1": {
                            "patterns": [
                                {
                                    "include": "#protocol"
                                }
                            ]
                        },
                        "2": {
                            "name": "constant.numeric.http"
                        },
                        "3": {
                            "name": "string.other.http"
                        }
                    },
                    "match": "(?i)^\\s*(HTTP\\/\\S+)\\s([1-5][0-9][0-9])\\s(.*)$",
                    "name": "http.responseLine"
                },
                "protocol": {
                    "patterns": [
                        {
                            "captures": {
                                "1": {
                                    "name": "keyword.other.http"
                                },
                                "2": {
                                    "name": "constant.numeric.http"
                                }
                            },
                            "name": "http.version",
                            "match": "(HTTP)\/(\\d+.\\d+)"
                        }
                    ]
                }
            }
        },
    })

    // const a = await shiki.getHighlighter({ theme: 'dark-plus' })
    console.log(highlighter.codeToHtml(`GET https://book.sweetlove.top/assets/index.4ffd98be.js HTTP/1.1
User-Agent: vscode-restclient
accept-encoding: gzip, deflate, br


HTTP/1.1 200 OK
Server: nginx/1.19.6
Date: Sun, 17 Jan 2021 02:37:18 GMT
Content-Type: application/javascript
Content-Length: 59652
Last-Modified: Thu, 14 Jan 2021 08:48:58 GMT
Connection: close
ETag: "6000057a-e904"
Content-Encoding: br`, { lang: 'http' }));
}



main()