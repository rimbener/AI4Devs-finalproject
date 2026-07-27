# Gherkin contract — ai-provider-registry-frontend

Each `@s` tag is an acceptance criterion. `spec.md` links here rather than restating behaviour.

```gherkin
Feature: AI provider registry — client consumption of the DB-driven catalog
  As a learner configuring AI providers and generating lessons, I want the provider names,
  guidance links, and model pickers I see to always reflect the live provider catalog — including
  a provider being disabled — so the app keeps working correctly when a provider's details change
  or a provider is retired, with no app update needed.

  # ── Catalog-driven identity (names + guidance links) ───────────────────────

  @s1
  Scenario: The settings screen shows the provider's current display name
    Given a provider's display name has been edited in the catalog
    When I open the API keys settings screen
    Then that provider's name shown to me is the current catalog value, not a hardcoded one

  @s2
  Scenario: The settings screen shows the provider's current guidance link
    Given a provider's guidance link has been edited in the catalog
    When I view that provider's key form
    Then the guidance link I'm offered is the current catalog value, not a hardcoded one

  # ── Catalog-driven ordering ──────────────────────────────────────────────────

  @s3
  Scenario: Providers render in catalog order everywhere they're listed
    Given the catalog's provider order is groq, openai, anthropic, google, xai, deepseek
    When I view the settings list, the add-key picker, and the generate-flow provider picker
    Then each shows the providers in that same order

  @s4
  Scenario: A provider's models render in catalog order in the generate flow
    Given a provider's models have a defined order in the catalog
    When I open the model picker for that provider
    Then the models appear in that same order

  # ── Disabled-provider visibility split ───────────────────────────────────────

  @s5
  Scenario: A disabled provider I already have a key for stays visible, badged
    Given I have a saved key for a provider
    And that provider is later disabled
    When I view my saved API keys
    Then that provider still appears in my saved-keys list
    And it is shown with a "Disabled" indicator

  @s6
  Scenario: A disabled provider's saved key is not deleted automatically
    Given I have a saved key for a provider that is later disabled
    When I view my saved API keys
    Then my key for that provider is still present, not removed

  @s7
  Scenario: I can still remove my key for a disabled provider
    Given I have a saved key for a provider that is now disabled
    When I choose to remove that key
    Then the removal proceeds and the key is no longer in my saved-keys list

  @s8
  Scenario: A disabled provider does not appear in the add-key picker
    Given a provider is disabled in the catalog
    And I do not have a saved key for it
    When I open the add-key picker
    Then that provider is not offered as a choice

  @s9
  Scenario: A disabled provider does not appear in the generate-flow provider picker
    Given a provider is disabled in the catalog
    And I have a saved key for it
    When I open the generate-flow provider picker
    Then that provider is not offered as a choice, even though I hold a key for it

  # ── Catalog-driven model list ────────────────────────────────────────────────

  @s10
  Scenario: The generate-flow model picker reflects the provider's current models
    Given a model has been added to a provider's catalog entry since I last opened the app
    When I open the model picker for that provider
    Then the newly added model appears as a choice with no app update

  # ── Loading state ─────────────────────────────────────────────────────────────

  @s11
  Scenario: The settings screen does not show a stale list while the catalog loads
    Given the provider catalog request is still in flight
    When I open the API keys settings screen
    Then I see the screen's existing loading indicator, not a flash of hardcoded provider data

  # ── generate-lesson error contract ───────────────────────────────────────────

  @s12
  Scenario: Generating with my own key is refused for a disabled provider, with distinct copy
    Given I generate a lesson naming a provider I have a saved key for
    And that provider is disabled at the moment generation runs
    When generation is refused
    Then I see copy telling me that provider is disabled, distinct from any other failure

  @s13
  Scenario: Generating with my own key for an unknown provider is unaffected
    Given I generate a lesson naming a provider absent from the catalog
    When generation is refused
    Then I see the same "invalid model" copy I would have seen before this feature

  @s14
  Scenario: Generating with a model the provider no longer curates is unaffected
    Given I generate a lesson naming a model no longer listed under that provider
    When generation is refused
    Then I see the same "invalid model" copy I would have seen before this feature

  @s15
  Scenario: Platform generation while the platform provider is disabled is unaffected
    Given I generate a lesson on a plan that uses the platform key
    And the platform provider is disabled in the catalog
    When generation is refused
    Then I see the same "temporarily unavailable" copy I would have seen before this feature

  # ── manage-api-key error contract ────────────────────────────────────────────

  @s16
  Scenario: Saving a key for a disabled provider is refused, with distinct copy
    Given a provider is disabled in the catalog
    When I try to save a key for that provider
    Then my save is refused
    And I see copy telling me that provider is disabled, distinct from a network failure

  @s17
  Scenario: Saving a key for an unknown provider is unaffected
    Given I try to save a key for a provider absent from the catalog
    When my save is refused
    Then I see the same generic error I would have seen before this feature

  @s18
  Scenario: Removing a key for an unknown provider is unaffected
    Given I try to remove a key for a provider absent from the catalog
    When my request is refused
    Then I see the same generic error I would have seen before this feature

  # ── No-regression / no-deploy proof ──────────────────────────────────────────

  @s19
  Scenario: The six existing providers render identically to today immediately after this ships
    Given the catalog is seeded to today's exact provider and model values
    When I view the settings screen, the add-key picker, and the generate-flow pickers
    Then every provider name, guidance link, model list, model order, and available choice matches
      what I would have seen before this feature shipped

  @s20
  Scenario: Reordering a provider in the catalog reorders it everywhere with no code change
    Given a provider's position in the catalog is changed
    When I view the settings list, the add-key picker, and the generate-flow provider picker
    Then each reflects the new order immediately

  @s21
  Scenario: Catalog rows alone drive identity, order, and visibility end to end
    Given a single catalog fixture is renamed, reordered, and has a provider disabled
    When that fixture is read through the catalog hook
    Then the settings screen, the add-key picker, and the generate-flow pickers all reflect the
      rename, the new order, and the disabled provider's exclusion — with no other code involved

  # ── Accessibility and cleanup ─────────────────────────────────────────────────

  @s22
  Scenario: The "Disabled" indicator is perceivable without relying on color alone
    Given a saved provider is shown with the "Disabled" indicator
    When the indicator is inspected by assistive technology or without color perception
    Then its disabled status is still conveyed, not communicated by color alone

  @s23
  Scenario: The hardcoded provider constants and locale keys are fully removed
    Given this feature has shipped
    When the codebase is searched for the old hardcoded provider/model registries and their locale
      keys
    Then no reference to any of them remains anywhere in the codebase
```
