# Gherkin contract — ai-provider-registry-backend

Each `@s` tag is an acceptance criterion. `spec.md` links here rather than restating behaviour.

```gherkin
Feature: AI provider registry — schema, RLS and Edge enforcement
  As the app's data layer, I want the provider/model catalog to live in Postgres
  so provider metadata can be edited without a code deploy, while saved keys keep
  real referential integrity against unknown or retired providers.

  # ── Schema, constraints and integrity ──────────────────────────────────────

  @s1
  Scenario: The provider catalog tables exist after migration
    Given the provider-registry migration has been applied
    Then a provider catalog table exists keyed by provider id
    And it carries a display name, an optional guidance URL, an enabled flag defaulting to true, and a position
    And a provider-model table exists keyed by provider id and model id
    And each model row carries a label, a vision-capable flag, a vision-default flag, and a position

  @s2
  Scenario: A provider cannot have two vision-default models
    Given a provider already has a model marked as its vision default
    When a second model of that same provider is marked as the vision default
    Then the change is rejected by the database

  @s3
  Scenario: A model that is not vision-capable cannot be the vision default
    Given a provider has a model that is not vision-capable
    When that model is marked as the provider's vision default
    Then the change is rejected by the database

  @s4
  Scenario: Removing a provider removes its models
    Given a provider exists with model rows and no saved keys reference it
    When that provider row is deleted
    Then its model rows are deleted with it

  @s5
  Scenario: The seeded catalog matches today's hardcoded registry exactly
    Given the provider-registry migration has been applied
    When I read the full provider catalog
    Then it contains exactly these providers, in this order:
      | id        | name      | guidance_url                                | enabled |
      | groq      | Groq      | https://console.groq.com/keys               | true    |
      | openai    | OpenAI    | https://platform.openai.com/api-keys        | true    |
      | anthropic | Anthropic | https://console.anthropic.com/settings/keys | true    |
      | google    | Google    | https://aistudio.google.com/app/apikey      | true    |
      | xai       | xAI       | https://console.x.ai                        | true    |
      | deepseek  | DeepSeek  | https://platform.deepseek.com/api_keys      | true    |
    And it contains exactly these models, in this order within each provider:
      | provider_id | model_id             | label             | vision | is_vision_default |
      | groq        | openai/gpt-oss-20b   | GPT-OSS 20B       | false  | false             |
      | groq        | openai/gpt-oss-120b  | GPT-OSS 120B      | false  | false             |
      | groq        | qwen/qwen3.6-27b     | Qwen 3.6 27B      | true   | true              |
      | openai      | gpt-5.6-luna         | GPT-5.6 Luna      | true   | true              |
      | openai      | gpt-5.6-terra        | GPT-5.6 Terra     | true   | false             |
      | anthropic   | claude-haiku-4-5     | Claude Haiku 4.5  | true   | true              |
      | anthropic   | claude-sonnet-5      | Claude Sonnet 5   | true   | false             |
      | google      | gemini-3.6-flash     | Gemini 3.6 Flash  | true   | true              |
      | google      | gemini-2.5-flash     | Gemini 2.5 Flash  | true   | false             |
      | xai         | grok-4.3             | Grok 4.3          | true   | true              |
      | xai         | grok-4.5             | Grok 4.5          | true   | false             |
      | deepseek    | deepseek-v4-flash    | DeepSeek V4 Flash | true   | true              |
      | deepseek    | deepseek-v4-pro      | DeepSeek V4 Pro   | true   | false             |

  @s6
  Scenario: A signed-in user can read the whole catalog including disabled providers
    Given I am authenticated
    And one provider is disabled
    When I read the provider catalog and the provider-model catalog
    Then I receive every provider, including the disabled one
    And I can see each provider's enabled flag

  @s7
  Scenario: The catalog is not readable by an anonymous client and not writable by any client
    Given I am not authenticated
    When I read the provider catalog
    Then the read returns nothing
    And no signed-in or anonymous client is permitted to insert, update or delete catalog rows

  @s8
  Scenario: A saved key cannot reference a provider that is not in the catalog
    Given the saved-keys table references the provider catalog
    When a saved key is written for a provider id absent from the catalog
    Then the write is rejected for violating referential integrity

  @s9
  Scenario: A provider that still has saved keys cannot be deleted
    Given a learner has a saved key for a provider
    When that provider row is deleted
    Then the deletion is blocked
    And disabling the provider remains the supported way to retire it

  # ── Catalog read and pure decisions ────────────────────────────────────────

  @s10
  Scenario: Reading one provider returns it with its models in catalog order
    Given the catalog holds a provider with several models
    When the catalog is read for that provider id
    Then the provider's name, guidance URL and enabled flag are returned
    And its models are returned in the order recorded in the catalog

  @s11
  Scenario: Reading an unknown provider returns nothing
    Given the catalog holds no provider with the requested id
    When the catalog is read for that provider id
    Then no provider entry is returned

  @s12
  Scenario: Model validity is decided from the provider's stored models
    Given a provider entry whose models are known
    When a model belonging to that provider is checked
    Then it is accepted
    But when a model absent from that provider is checked
    Then it is rejected

  @s13
  Scenario: A vision-capable selected model is used for image placement
    Given a provider entry whose selected model is vision-capable
    When the image-placement model is resolved
    Then the selected model is used

  @s14
  Scenario: A text-only selected model falls back to the provider's vision default
    Given a provider entry whose selected model is not vision-capable
    And that provider has a vision-default model
    When the image-placement model is resolved
    Then the provider's vision-default model is used

  @s15
  Scenario: A provider with no vision default degrades to text-only
    Given a provider entry whose selected model is not vision-capable
    And that provider has no vision-default model
    When the image-placement model is resolved
    Then no vision model is used and placement degrades to text-only

  # ── Happy path ─────────────────────────────────────────────────────────────

  @s16
  Scenario: Generation with the learner's own key succeeds on catalog metadata
    Given I am authenticated on a plan that uses my own key
    And I have a saved key for an enabled provider
    When I generate a lesson naming that provider and one of its catalog models
    Then the catalog is read once for that provider
    And generation proceeds against that provider and model
    And a lesson is returned

  # ── Rejections and fail-closed behaviour ───────────────────────────────────

  @s17
  Scenario: Generation with my own key is rejected for a disabled provider
    Given I am authenticated on a plan that uses my own key
    And I have a saved key for a provider that is now disabled
    When I generate a lesson naming that provider
    Then generation is refused as a disabled provider
    And no provider API call is made

  @s18
  Scenario: Generation is rejected for a provider absent from the catalog
    Given I am authenticated on a plan that uses my own key
    When I generate a lesson naming a provider absent from the catalog
    Then generation is refused as an invalid model, exactly as before this feature

  @s19
  Scenario: Generation is rejected for a model the provider no longer offers
    Given I am authenticated on a plan that uses my own key
    And I have a saved key for an enabled provider
    When I generate a lesson naming a model absent from that provider's catalog models
    Then generation is refused as an invalid model

  @s20
  Scenario: Platform generation is unavailable while its provider is disabled
    Given I am authenticated on a plan that uses the platform key
    And the platform provider is disabled in the catalog
    When I generate a lesson
    Then generation is refused as platform generation being temporarily unavailable
    And no provider API call is made

  @s21
  Scenario: Generation fails closed when the catalog cannot be read
    Given I am authenticated on a plan that uses my own key
    And the catalog read will fail
    When I generate a lesson
    Then generation is refused
    And no provider API call is made
    And no previously hardcoded provider list is used as a fallback

  @s22
  Scenario: Saving a key is rejected for a disabled provider
    Given I am authenticated
    And a provider is disabled in the catalog
    When I save an API key for that provider
    Then the request is refused as a disabled provider
    And no key is stored

  @s23
  Scenario: Saving a key is rejected for a provider absent from the catalog
    Given I am authenticated
    When I save an API key for a provider absent from the catalog
    Then the request is refused exactly as it was before this feature
    And no key is stored

  @s24
  Scenario: Removing a key succeeds for a disabled provider
    Given I am authenticated
    And I have a saved key for a provider that is now disabled
    When I remove my key for that provider
    Then the key is removed
    And my remaining saved keys are returned

  @s25
  Scenario: Removing a key is rejected for a provider absent from the catalog
    Given I am authenticated
    When I remove a key for a provider absent from the catalog
    Then the request is refused exactly as it was before this feature

  @s26
  Scenario: Saving a key fails closed when the catalog cannot be read
    Given I am authenticated
    And the catalog read will fail
    When I save an API key
    Then the request is refused
    And no key is stored
    And no previously hardcoded provider list is used as a fallback

  # ── Cross-layer integration ────────────────────────────────────────────────

  @s27
  Scenario: Catalog rows drive validation and vision resolution end to end
    Given a provider whose catalog rows are known
    When a generation request for that provider is resolved
    Then the catalog rows alone decide whether the provider is usable
    And the catalog rows alone decide which model may be used
    And the catalog rows alone decide which model handles image placement

  @s28
  Scenario: Disabling a provider takes effect on the very next request
    Given a provider is enabled and a generation request for it has just succeeded
    When that provider is disabled in the catalog
    And another generation request names that provider
    Then that request is refused as a disabled provider
    And no stale catalog from the earlier request is reused
```
