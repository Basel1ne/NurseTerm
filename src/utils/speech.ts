export function speakEnglishWord(text: string, rate: number = 0.85): void {
  if (!('speechSynthesis' in window)) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate; // slightly slower for precise anatomical clarity
  utterance.pitch = 1.0;

  // Attempt to select an English voice
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.default)
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (enVoice) {
    utterance.voice = enVoice;
  }

  window.speechSynthesis.speak(utterance);
}
