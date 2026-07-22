# Gherkin — multi-provider-ai-keys

```gherkin
Feature: Multi-provider AI keys and model picker
  As a free-tier learner
  I want to save keys for multiple AI providers and pick provider + model per generation
  So that I can use my preferred provider/model instead of being locked to one

  Background:
    Given I am an authenticated learner
    And the curated provider order is groq, openai, anthropic, google, xai, deepseek
    # Persona-neutral: each scenario states its own plan/persona. Free-tier =
    # plan use_platform_key false (key settings + BYOK pickers shown); @s19 is paid.

  # ---------------------------------------------------------------------------
  # Slice 1 — multi-key storage & settings
  # ---------------------------------------------------------------------------

  @s1
  Scenario: Empty key settings invite adding a provider
    Given I am on the free tier
    And I have no saved provider keys
    When I open key settings
    Then I see an empty configured-keys list
    And I see an "add new provider" action

  @s2
  Scenario: Adding a key for a new provider
    Given I am on the free tier
    And I have no saved key for a chosen provider
    When I add that provider and submit a key
    Then that provider appears in the configured-keys list as a masked "key saved" row
    And the raw key is never shown after saving

  @s3
  Scenario: An already-saved provider is not offered again
    Given I am on the free tier
    And I already have a saved key for a provider
    When I open the add-new-provider picker
    Then that provider is not offered as a choice

  @s4
  Scenario: Updating a provider's key replaces only that provider
    Given I am on the free tier
    And I have saved keys for two different providers
    When I replace the key for one of them
    Then that provider's stored key is replaced
    And the other provider's key is unchanged

  @s5
  Scenario: Removing a provider's key keeps the others
    Given I am on the free tier
    And I have saved keys for two different providers
    When I remove one provider's key
    Then that provider's key is deleted
    And the other provider's key remains

  @s6
  Scenario: Adding is unavailable once every provider is saved
    Given I am on the free tier
    And I have a saved key for all six providers
    When I open key settings
    Then the "add new provider" action is hidden

  @s7
  Scenario: Key settings show a loading state while status is fetched
    Given I am on the free tier
    And my saved-keys status request is pending
    When I open key settings
    Then I see a loading state instead of the list

  @s8
  Scenario: A save or remove failure is recoverable
    Given I am on the free tier
    And the save or remove request will fail
    When I submit a key change
    Then I see an error message
    And my existing configured-keys list is unchanged
    And I can retry the change

  @s9
  Scenario: The client never learns key material
    Given I am on the free tier
    And I have a saved provider key
    When the client reads saved-keys status after any save, update, or remove
    Then it only ever receives provider and last-updated metadata
    And no raw key characters are present in client state, responses, or server logs

  # ---------------------------------------------------------------------------
  # Slice 2 — provider/model pickers on generate, server routing, vision
  # ---------------------------------------------------------------------------

  @s10
  Scenario: Generate offers only saved providers and their curated models
    Given I am on the free tier
    And I have saved keys for one or more providers
    When I open the generate flow
    Then I can pick among my saved providers only
    And I can then pick a model from that provider's curated allow-list

  @s11
  Scenario: Switching provider resets the model selection
    Given I am on the free tier
    And I am in the generate flow with a provider and model selected
    When I switch to a different saved provider
    Then the model selection resets to that provider's first curated model

  @s12
  Scenario: Generation runs server-side with the chosen provider and model
    Given I am on the free tier with use_platform_key false
    And I have chosen a saved provider and a curated model
    When generation runs
    Then the server reads that provider's stored key from secure storage
    And the provider call uses that key and the selected model via the Vercel AI SDK
    And no key material is returned to the client or written to logs

  @s13
  Scenario: A vision-capable selected model handles image placement
    Given I am on the free tier with use_platform_key false
    And the selected model is vision-capable
    And an image needs vision-based placement
    When generation runs
    Then the selected model is used for the image-placement decision

  @s14
  Scenario: A non-vision selected model falls back to the curated vision default
    Given I am on the free tier with use_platform_key false
    And the selected model is not vision-capable
    And the provider has a curated vision default model
    And an image needs vision-based placement
    When generation runs
    Then the provider's curated vision default model is used for the image-placement decision

  @s15
  Scenario: A provider with no vision model degrades images to text-only
    Given I am on the free tier with use_platform_key false
    And the selected provider has no vision-capable model and no vision default
    And an image cannot be placed from metadata
    When generation runs
    Then the vision-placement call is skipped
    And the un-anchorable image degrades to text-only rather than failing the lesson

  @s16
  Scenario: Free generation without any saved key still gates gracefully
    Given I am on the free tier
    And I have no saved provider keys
    When I reach the generate flow
    Then the existing missing-key gate applies with a path to add a key
    And nothing crashes

  @s17
  Scenario: A request naming a provider I have no key for is rejected
    Given I am on the free tier with use_platform_key false
    And a generation request names a provider I have no saved key for
    When the request reaches the server
    Then generation is rejected with error code "missing_key"

  @s18
  Scenario: A request naming an unknown provider or model is rejected
    Given I am on the free tier with use_platform_key false
    And a generation request names a provider or model not in the curated registry
    When the request reaches the server
    Then generation is rejected with error code "invalid_model"

  @s19
  Scenario: Paid learners keep the platform path with no pickers
    Given my plan has use_platform_key true
    When I open the generate flow
    Then no provider or model pickers are shown
    And generation uses only the platform Groq key
    And my saved user keys are not used

  # ---------------------------------------------------------------------------
  # Slice 3 — remember last-used provider + model (on device)
  # ---------------------------------------------------------------------------

  @s20
  Scenario: The last-used provider and model are remembered
    Given I am on the free tier
    And I previously generated with a saved provider and curated model
    When I reopen the generate flow while that provider and model are still valid
    Then that provider and model are preselected
    And generating again saves the current provider and model on the device

  @s21
  Scenario Outline: An invalid or missing preference falls back quietly
    Given I am on the free tier
    And my stored generation preference is "<state>"
    When I open the generate flow
    Then the first saved provider in fixed order is preselected
    And that provider's first curated model is preselected
    And nothing crashes

    Examples:
      | state                                     |
      | for a provider whose key was deleted      |
      | for a model no longer in the registry     |
      | missing or corrupt                        |
```
