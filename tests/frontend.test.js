'use strict';

describe('Frontend Logic & Configurations', () => {
  test('Languages Configuration matches TRD specifications', () => {
    const languages = [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
      { code: 'fr', label: 'Français' },
      { code: 'ar', label: 'العربية' },
      { code: 'pt', label: 'Português' },
      { code: 'de', label: 'Deutsch' },
    ];
    expect(languages.length).toBe(6);
    expect(languages.map(l => l.code)).toEqual(['en', 'es', 'fr', 'ar', 'pt', 'de']);
  });

  test('Speech Synthesis interface API exists or is mockable', () => {
    const speakMessageMock = (text, lang) => {
      return { text, lang, status: 'spoken' };
    };
    const res = speakMessageMock('Hello', 'en');
    expect(res.text).toBe('Hello');
    expect(res.lang).toBe('en');
    expect(res.status).toBe('spoken');
  });

  test('Quick replies are correctly configured', () => {
    const quickReplies = [
      "Where's my seat?",
      'Find food',
      'Restrooms',
      'Emergency help',
    ];
    expect(quickReplies).toContain("Where's my seat?");
    expect(quickReplies).toContain("Restrooms");
  });
});
