import { useEffect } from 'react';

export function useLearningTitle(title: string) {
  useEffect(() => {
    document.title = title;
    const description = `${title}. Free, authored life-skills learning for Indian learners, with practice quizzes and saved learning habits.`;
    for (const [attribute, name, content] of [
      ['name', 'description', description],
      ['property', 'og:title', title],
      ['property', 'og:description', description],
    ]) {
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute!, name!);
        document.head.append(tag);
      }
      tag.content = content!;
    }
  }, [title]);
}
