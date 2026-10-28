import re
from html.parser import HTMLParser
from html import escape

ALLOWED_TAGS = {
    "p", "div", "span", "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "code", "pre", "strong", "em", "b", "i", "u", "s", "strike",
    "a", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "br", "hr",
    "img", "sup", "sub", "details", "summary",
}

ALLOWED_ATTRS = {
    "a": {"href", "title", "target", "rel", "class"},
    "img": {"src", "alt", "title", "width", "height", "class"},
    "code": {"class"},
    "pre": {"class"},
    "div": {"class"},
    "span": {"class"},
    "table": {"class", "border"},
    "th": {"class", "colspan", "rowspan", "scope"},
    "td": {"class", "colspan", "rowspan"},
}

IGNORE_CONTENT_TAGS = {
    "script", "style", "svg", "noscript", "template",
    "iframe", "object", "embed", "form", "canvas", "video", "audio", "textarea"
}

SAFE_URL_RE = re.compile(r"^(https?:\/\/|\/(?!\/)|mailto:)", re.IGNORECASE)


class HTMLSanitizer(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.output = []
        self.tag_stack = []
        self.ignore_depth = 0

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag in IGNORE_CONTENT_TAGS:
            self.ignore_depth += 1
            return
        if self.ignore_depth > 0:
            return

        if tag in ALLOWED_TAGS:
            cleaned_attrs = []
            allowed_for_tag = ALLOWED_ATTRS.get(tag, set())
            has_blank_target = False
            has_rel = False

            for name, value in attrs:
                name = name.lower()
                if name.startswith("on"):
                    continue
                if name in allowed_for_tag:
                    if name in ("href", "src"):
                        raw_val = value.strip()
                        # Reject protocol-relative URLs
                        if raw_val.startswith("//"):
                            continue
                        clean_check = re.sub(r"[\s\x00-\x1f]+", "", raw_val).lower()
                        if any(clean_check.startswith(p) for p in ("javascript:", "vbscript:", "data:", "file:", "about:")):
                            continue
                        if not SAFE_URL_RE.match(raw_val):
                            continue
                        val_escaped = escape(raw_val, quote=True)
                        cleaned_attrs.append(f'{name}="{val_escaped}"')
                    elif name == "target":
                        if value.lower() in ("_blank", "_self"):
                            cleaned_attrs.append(f'{name}="{value.lower()}"')
                            if value.lower() == "_blank":
                                has_blank_target = True
                    elif name == "rel":
                        has_rel = True
                        val_escaped = escape(value, quote=True)
                        cleaned_attrs.append(f'{name}="{val_escaped}"')
                    else:
                        val_escaped = escape(value, quote=True)
                        cleaned_attrs.append(f'{name}="{val_escaped}"')

            if tag == "a" and has_blank_target and not has_rel:
                cleaned_attrs.append('rel="noopener noreferrer"')

            attr_str = (" " + " ".join(cleaned_attrs)) if cleaned_attrs else ""
            if tag in ("br", "hr", "img"):
                self.output.append(f"<{tag}{attr_str} />")
            else:
                self.output.append(f"<{tag}{attr_str}>")
                self.tag_stack.append(tag)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in IGNORE_CONTENT_TAGS:
            if self.ignore_depth > 0:
                self.ignore_depth -= 1
            return
        if self.ignore_depth > 0:
            return

        if tag in ALLOWED_TAGS and tag not in ("br", "hr", "img"):
            if tag in self.tag_stack:
                while self.tag_stack:
                    popped = self.tag_stack.pop()
                    self.output.append(f"</{popped}>")
                    if popped == tag:
                        break

    def handle_data(self, data):
        if self.ignore_depth > 0:
            return
        self.output.append(escape(data, quote=False))

    def get_html(self):
        while self.tag_stack:
            popped = self.tag_stack.pop()
            self.output.append(f"</{popped}>")
        return "".join(self.output)


def sanitize_html(html_content: str) -> str:
    if not html_content:
        return ""
    parser = HTMLSanitizer()
    parser.feed(html_content)
    return parser.get_html()
