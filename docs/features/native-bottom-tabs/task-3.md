---
id: task-3
title: New Lesson CTA on My lessons → PDF files tab
slice: 2
scenarios: [s6, s7, s8]
status: done
paths:
  [
    libs/study-buddy/src/components/saved-lessons/saved-lessons.tsx,
    libs/study-buddy/src/components/saved-lessons/saved-lessons.test.tsx,
    libs/study-buddy/src/components/saved-lessons/saved-lessons.stories.tsx,
    apps/app-study-buddy/src/app/(app)/(tabs)/pdf-files.tsx,
    libs/study-buddy/src/components/pdf-documents/pdf-documents.tsx,
  ]
---

## Goal
Persistent **New Lesson** CTA on `SavedLessons` (content + empty) labelled `nav.newLesson`, pushing **`/pdf-files`**. PDF upload/generate is hosted by self-contained **`PdfDocuments`** on the PDF files screen (no `/upload` route).

## Done criteria
- [x] CTA in content + empty; `router.push('/pdf-files')` (s6, s8)
- [x] `(tabs)/pdf-files` renders `ApiKeyGate` + `PdfDocuments` (s7)
- [x] `PdfDocuments` owns navigation, profile gate, `NewLessonDialog` (no props)
- [x] Unit tests updated; lint / types / tests green

## Notes
- Label stays `nav.newLesson`; destination is the PDF files tab.
