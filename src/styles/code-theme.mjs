/**
 * MehhSpace code theme — a Shiki (TextMate) theme built from the SpaceHey
 * palette in global.css, so syntax colors sit in the same family as the rest
 * of the site instead of the modern dark editor look Shiki ships by default.
 *
 * Shiki writes these colors as inline styles on each token, which is why they
 * live here and not in the stylesheet. The BOX around the code — border, the
 * orange language bar, fonts, scrolling — is styled in global.css under
 * `.content pre`, so it applies to every post section at once.
 *
 * Hex values mirror the --custom-properties in global.css. Keep them in sync.
 */
export const mehhspaceCodeTheme = {
  name: 'mehhspace',
  type: 'light',
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#1A1A1A',
  },
  settings: [
    { settings: { background: '#FFFFFF', foreground: '#1A1A1A' } },

    // comments — --dark-gray, italic
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
      settings: { foreground: '#919191', fontStyle: 'italic' },
    },

    // strings — a green that reads on white without fighting the blues
    {
      scope: ['string', 'string.quoted', 'constant.other.symbol', 'meta.embedded.assembly'],
      settings: { foreground: '#1D7A3E' },
    },

    // numbers / language constants (true, null, 42) — muted purple
    {
      scope: [
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.other',
        'keyword.other.unit',
      ],
      settings: { foreground: '#7C2D91' },
    },

    // keywords & storage (if, return, const, def) — --dark-orange
    {
      scope: ['keyword', 'keyword.control', 'storage', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#ED0707' },
    },

    // operators — --darker-gray
    {
      scope: ['keyword.operator', 'punctuation', 'meta.brace', 'punctuation.separator'],
      settings: { foreground: '#545454' },
    },

    // …but quote marks belong to the string they wrap, not to punctuation.
    // More scope segments beat the broad `punctuation` rule above.
    {
      scope: ['punctuation.definition.string', 'punctuation.definition.string.begin', 'punctuation.definition.string.end'],
      settings: { foreground: '#1D7A3E' },
    },

    // functions — --logo-blue
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call',
        'variable.function',
      ],
      settings: { foreground: '#1D4ED8' },
    },

    // types & classes — --darker-blue
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'entity.other.inherited-class',
        'support.type',
        'support.class',
      ],
      settings: { foreground: '#1E40AF' },
    },

    // variables / parameters — plain body text
    {
      scope: ['variable', 'variable.parameter', 'variable.other', 'meta.definition.variable'],
      settings: { foreground: '#1A1A1A' },
    },

    // markup: HTML/XML tags and attributes
    {
      scope: ['entity.name.tag', 'punctuation.definition.tag'],
      settings: { foreground: '#ED0707' },
    },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#1D4ED8' } },

    // CSS selectors / properties
    { scope: ['entity.other.attribute-name.class', 'entity.other.attribute-name.id'], settings: { foreground: '#1E40AF' } },
    { scope: ['support.type.property-name'], settings: { foreground: '#1D4ED8' } },

    // shell prompts / invalid
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: '#FF0000' } },
  ],
};
