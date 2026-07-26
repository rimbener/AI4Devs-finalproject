import type { TranslationResource } from './en';

/** German bundle. Key-aligned with `en` (compiler-enforced). Copy pending native review (R6). */
export const de: TranslationResource = {
  translation: {
    general: {
      save: 'Speichern',
      saving: 'Speichern…',
    },
    brand: {
      name: 'AI Study Buddy',
    },
    error: {
      network: 'Netzwerkfehler. Versuche es erneut.',
    },
    nav: {
      myLessons: 'Meine Lektionen',
      myPdfFiles: 'Meine PDF-Dateien',
      newLesson: 'Neue Lektion',
      settings: 'Einstellungen',
      openAccountMenu: 'Kontomenü von {{label}} öffnen',
      lesson: 'Lektion',
      study: 'Lernen',
      results: 'Ergebnisse',
      logIn: 'Anmelden',
      signUp: 'Registrieren',
    },
    home: {
      savedLessons: 'Meine Lektionen',
      openDemo: 'Demo-Lektion öffnen',
      loading: 'Meine Lektionen werden geladen…',
      empty: 'Noch keine Lektionen. Erstelle eine, um zu starten.',
      error: 'Deine Lektionen konnten nicht geladen werden.',
      retry: 'Erneut versuchen',
      openLesson: '{{title}} öffnen',
      createdDate: '{{date}}',
      delete: {
        action: '{{title}} löschen',
        confirmHeadline: 'Diese Lektion löschen?',
        confirmBody: 'Dadurch werden die Lektion und dein Fortschritt dauerhaft entfernt.',
        confirmAction: 'Löschen',
        cancelAction: 'Abbrechen',
        failed: 'Diese Lektion konnte nicht gelöscht werden.',
      },
    },
    pdfList: {
      heading: 'Deine PDFs',
      loading: 'Deine PDFs werden geladen…',
      empty: 'Noch keine extrahierten PDFs. Lade eines hoch, um zu starten.',
      error: 'Deine PDFs konnten nicht geladen werden.',
      retry: 'Erneut versuchen',
      status: {
        ready: 'Bereit zum Generieren',
        failed: 'Generierung fehlgeschlagen',
        generated: 'Lektion bereit',
      },
      action: {
        generate: 'Generieren',
        retry: 'Erneut versuchen',
        openLesson: 'Lektion öffnen',
        generateA11y: '{{filename}} generieren',
        retryA11y: '{{filename}} erneut versuchen',
        openLessonA11y: 'Lektion für {{filename}} öffnen',
      },
      createdDate: '{{date}}',
      pageCount: '{{count}} Seiten',
      delete: {
        action: '{{filename}} löschen',
        confirmHeadline: 'Dieses PDF löschen?',
        confirmBody: 'Dadurch werden das PDF und seine extrahierten Daten dauerhaft entfernt.',
        confirmAction: 'Löschen',
        cancelAction: 'Abbrechen',
        failed: 'Dieses PDF konnte nicht gelöscht werden.',
      },
    },
    lessons: {
      count_one: '{{count}} Lektion',
      count_other: '{{count}} Lektionen',
    },
    entitlements: {
      loading: 'Dein Profil wird geladen…',
      error: {
        message: 'Dein Profil konnte nicht geladen werden.',
        retry: 'Erneut versuchen',
      },
    },
    fonts: {
      loading: 'Schriften werden geladen…',
      error: {
        message:
          'Es ist ein Fehler aufgetreten, während die Schriften geladen werden. Bitte versuche es erneut.',
      },
    },
    upload: {
      intro: 'Lade ein PDF hoch, um eine Lektion zu erstellen',
      apiKeyRequired: {
        message: 'Ein API-Schlüssel ist erforderlich, um Lektionen zu erstellen.',
        action: 'API-Schlüssel hinzufügen',
      },
      cannotCreate: 'Du kannst keine Lektionen erstellen. Bitte kontaktiere den Support.',
      chooseFile: 'PDF auswählen',
      dialogHeadline: 'PDF hochladen',
      dialogClose: 'Schließen',
      loading: 'Wird extrahiert…',
      filenameLabel: 'Datei',
      pageCountLabel: 'Seiten',
      imageCountLabel: 'Bilder',
      continue: 'Weiter',
      // task-13/Slice-3 — native German translations (replaces the Slice-2 verbatim-English stub).
      constraintsHint: 'Max. {{maxMb}} MB, {{maxPages}} Seiten',
      retryAction: 'Erneut versuchen',
      imageCount_one: '{{count}} Bild extrahiert',
      imageCount_other: '{{count}} Bilder extrahiert',
      error: {
        unsupportedType: 'Es werden nur PDF-Dateien unterstützt',
        fileTooLarge: 'Diese Datei ist zu groß (max. 10 MB)',
        tooManyPages: 'Dieses PDF hat zu viele Seiten (max. 20)',
        scannedNotSupported:
          'Dieses PDF scheint gescannt zu sein; wir können den Text noch nicht lesen',
        corrupt: 'Dieses PDF konnte nicht geöffnet werden',
        extractionFailed: 'Beim Lesen deines PDFs ist etwas schiefgelaufen',
        unauthenticated: 'Bitte melde dich an, um hochzuladen',
      },
    },
    generation: {
      dialogHeadline: 'Lektion erstellen',
      provider: {
        heading: 'KI-Anbieter',
      },
      model: {
        heading: 'Modell',
      },
      composition: {
        heading: 'Lektionsinhalt',
        instructionalOnly: 'Nur lehrreich',
        activityOnly: 'Nur Aktivitäten',
        both: 'Beides',
      },
      generate: 'Lektion generieren',
      step: {
        reading: 'Inhalt wird gelesen',
        generating: 'Folien werden erstellt',
        attaching: 'Bilder werden angehängt',
        status: {
          done: 'erledigt',
          current: 'läuft',
          upcoming: 'ausstehend',
        },
      },
      ready: {
        slideCount_one: '{{count}} Folie erstellt',
        slideCount_other: '{{count}} Folien erstellt',
        composition: 'Zusammensetzung: {{composition}}',
        openInPlayer: 'Im Player öffnen',
      },
      error: {
        missingKey: 'Zum Generieren von Lektionen ist ein API-Schlüssel erforderlich.',
        invalidKey: 'Dein API-Schlüssel wurde abgelehnt. Überprüfe ihn in den Einstellungen.',
        invalidModel:
          'Dieser Anbieter oder dieses Modell ist nicht mehr verfügbar. Wähle ein anderes und versuche es erneut.',
        platformKeyUnavailable:
          'Die Lektionserstellung ist vorübergehend nicht verfügbar. Versuche es erneut.',
        rateLimited:
          'Du hast das Ratenlimit des Anbieters erreicht. Versuche es gleich noch einmal.',
        timeout: 'Die Generierung hat zu lange gedauert. Versuche es erneut.',
        generationFailed:
          'Beim Generieren deiner Lektion ist etwas schiefgelaufen. Versuche es erneut.',
        documentNotReady: 'Dieses Dokument ist noch nicht bereit. Lade dein PDF erneut hoch.',
        unauthenticated: 'Bitte melde dich an, um eine Lektion zu generieren.',
        persistFailed: 'Deine Lektion konnte nicht gespeichert werden. Versuche es erneut.',
        action: {
          retry: 'Erneut versuchen',
          settings: 'Zu den Einstellungen',
          signIn: 'Anmelden',
        },
      },
    },
    aiModel: {
      groq: {
        gptOss20b: 'GPT-OSS 20B',
        gptOss120b: 'GPT-OSS 120B',
        qwen36_27b: 'Qwen 3.6 27B',
      },
      openai: {
        gpt56Luna: 'GPT-5.6 Luna',
        gpt56Terra: 'GPT-5.6 Terra',
      },
      anthropic: {
        claudeHaiku45: 'Claude Haiku 4.5',
        claudeSonnet5: 'Claude Sonnet 5',
      },
      google: {
        gemini36Flash: 'Gemini 3.6 Flash',
        gemini25Flash: 'Gemini 2.5 Flash',
      },
      xai: {
        grok43: 'Grok 4.3',
        grok45: 'Grok 4.5',
      },
      deepseek: {
        v4Flash: 'DeepSeek V4 Flash',
        v4Pro: 'DeepSeek V4 Pro',
      },
    },
    lesson: {
      title: 'Lektion {{id}}',
      start: 'Lernen beginnen',
      viewResults: 'Ergebnisse ansehen',
    },
    player: {
      loading: 'Lektion wird geladen…',
      next: 'Weiter',
      back: 'Zurück',
      slideOf: 'Folie {{current}} von {{total}}',
      empty: {
        message: 'Diese Lektion hat noch keine Folien.',
      },
      error: {
        message: 'Diese Lektion konnte nicht geladen werden.',
        retry: 'Erneut versuchen',
      },
      slideImage: {
        expand: 'Bild im Vollbild anzeigen',
        close: 'Bild schließen',
        dialog: 'Bildbetrachter',
      },
      slideBody: {
        scroll: 'Folieninhalt',
      },
    },
    results: {
      score: '{{correct}} / {{total}}',
      scorePercent: '{{percent}}%',
      scoreAnnouncement: '{{score}}, {{percent}}',
      retake: 'Aktivitäten wiederholen',
      backHome: 'Zurück zu meinen Lektionen',
      completeHeadline: 'Lektion abgeschlossen',
      completeBody: 'Du hast das Ende dieser Lektion erreicht.',
      saveFailed: 'Dieser Versuch konnte nicht gespeichert werden',
      retrySave: 'Erneut versuchen',
    },
    auth: {
      email: 'E-Mail',
      password: 'Passwort',
      submit: 'Anmelden',
      signingIn: 'Anmeldung läuft…',
      signingOut: 'Abmeldung läuft…',
      toSignUp: 'Kein Konto? Registrieren',
      toLogIn: 'Schon ein Konto? Anmelden',
      logOut: 'Abmelden',
      logOutError: 'Es ist ein Fehler aufgetreten, während du abmeldest.',
      logOutRetry: 'Erneut versuchen',
      logOutConfirmHeadline: 'Abmelden?',
      logOutConfirmBody: 'Du musst dich erneut anmelden, um auf deine Lektionen zuzugreifen.',
      logOutConfirmAction: 'Abmelden',
      logOutCancelAction: 'Abbrechen',
      error: {
        email: 'Bitte gib eine gültige E-Mail-Adresse ein',
        invalidCredentials: 'E-Mail oder Passwort ungültig',
      },
    },
    settings: {
      title: 'Einstellungen',
      language: {
        heading: 'Sprache',
        a11yLabel: 'Sprache auswählen',
      },
      apiKey: {
        inputLabel: 'API-Schlüssel',
        loadingStatus: 'Status deines API-Schlüssels wird geprüft…',
        showSettings: 'API-Schlüssel-Einstellungen anzeigen',
        screenTitle: 'API-Schlüssel-Einstellungen',
        replace: 'Ersetzen',
        remove: 'Entfernen',
        savedStatus: '{{provider}}-Schlüssel gespeichert · Aktualisiert {{date}}',
        provider: {
          groq: 'Groq',
          openai: 'OpenAI',
          anthropic: 'Anthropic',
          google: 'Google',
          xai: 'xAI',
          deepseek: 'DeepSeek',
        },
        guidanceTemplate: 'Noch keinen Schlüssel? Bei {{provider}} erhalten',
        guidance: 'Noch keinen Schlüssel? Bei Groq erhalten',
        removeConfirmHeadline: 'API-Schlüssel entfernen?',
        removeConfirmBody:
          'Du musst einen neuen Schlüssel hinzufügen, um wieder Lektionen zu erstellen.',
        removeConfirmAction: 'Entfernen bestätigen',
        removeConfirmCancelAction: 'Abbrechen',
        manager: {
          addHeading: 'Anbieter hinzufügen',
          addNew: 'Neuen Anbieter hinzufügen',
          selectProvider: 'Anbieter auswählen',
          emptyMessage: 'Keine API-Schlüssel gespeichert',
        },
        error: {
          empty: 'Gib deinen API-Schlüssel ein.',
        },
      },
    },
    activity: {
      mcq: {
        submit: 'Absenden',
        correct: 'Richtig',
        incorrect: 'Falsch',
        explanation: 'Erklärung',
        unavailable: 'Diese Frage ist nicht verfügbar',
      },
      matching: {
        submit: 'Absenden',
        correct: 'Alles richtig!',
        incorrect: 'Nicht ganz',
        correctPair: 'richtig',
        incorrectPair: 'falsch',
        explanationHeading: 'Warum',
        summary: '{{correct}} von {{total}} richtig',
        unavailable: 'Diese Aktivität ist nicht verfügbar',
      },
      fillInTheBlank: {
        submit: 'Absenden',
        correct: 'Richtig!',
        incorrect: 'Falsch',
        explanationHeading: 'Warum',
        unavailable: 'Diese Aktivität ist nicht verfügbar',
        blankInput: 'Lücke ausfüllen',
      },
      openEnded: {
        submit: 'Absenden',
        yourAnswer: 'Deine Antwort',
        modelAnswer: 'Musterantwort',
        explanationHeading: 'Warum',
        unavailable: 'Diese Aktivität ist nicht verfügbar',
        answerInput: 'Deine Antwort',
      },
      flashcard: {
        reveal: 'Antwort aufdecken',
        recalled: 'Gewusst',
        notRecalled: 'Nicht gewusst',
        recalledConfirmed: 'Als gewusst markiert',
        notRecalledConfirmed: 'Als nicht gewusst markiert',
        answerHeading: 'Antwort',
        explanationHeading: 'Warum',
        unavailable: 'Diese Aktivität ist nicht verfügbar',
      },
    },
  },
};
