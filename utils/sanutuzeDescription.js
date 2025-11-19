const sanitizeHtml = require("sanitize-html");

function sanitizeDescription(html) {
    return sanitizeHtml(html || "", {
        allowedTags: [
            'b', 'i', 'em', 'strong', 'u', 'p', 'br',
            'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'a', 'img', 'blockquote'
        ],
        allowedAttributes: {
            a: ['href', 'name', 'target', 'rel'],
            img: ['src', 'alt', 'title', 'width', 'height'],
            '*': ['class']
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        transformTags: {
            'a': sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' })
        }
    });
}

module.exports = sanitizeDescription;
