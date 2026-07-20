# gherkin-scenarios — activity-image-sizing

```gherkin
Feature: Activity image sizing + in-app lightbox
  As a learner, I want lesson activity images capped at a readable width with a
  fullscreen viewer, so large images don't break the slide and I can inspect detail.

  @s1
  Scenario: Inline image is capped at the readable max width and centered
    Given a slide whose image URL has resolved
    And the available width is wider than the readable maximum
    When the slide renders
    Then the image is displayed no wider than the readable maximum width
    And the image is horizontally centered within the slide

  @s2
  Scenario: Inline image scales down on a narrow viewport
    Given a slide whose image URL has resolved
    And the available width is narrower than the readable maximum
    When the slide renders
    Then the image fits the available width without overflowing the slide

  @s3
  Scenario: Expand control is shown once the image URL is ready
    Given a slide whose image URL has resolved
    When the slide renders
    Then an expand control is shown overlaid on the image

  @s4
  Scenario: No expand control when the slide has no image
    Given a slide with no image
    When the slide renders
    Then nothing is rendered for the image
    And no expand control is shown

  @s5
  Scenario: No expand control and no lightbox when the image URL cannot be resolved
    Given a slide that references an image whose URL fails to resolve
    When the slide renders
    Then nothing is rendered for the image
    And no expand control is shown
    And the lightbox cannot be opened

  @s6
  Scenario: Opening the lightbox shows the image fullscreen
    Given a slide whose image URL has resolved
    When I activate the expand control
    Then the image opens in a fullscreen lightbox
    And the image is shown fully contained without cropping

  @s7
  Scenario: Close the lightbox with the close control
    Given the image is open in the lightbox
    When I activate the close control
    Then the lightbox is dismissed
    And I return to the activity slide

  @s8
  Scenario: Close the lightbox by tapping the backdrop
    Given the image is open in the lightbox
    When I tap the backdrop outside the image
    Then the lightbox is dismissed
    And I return to the activity slide

  @s9
  Scenario: Close the lightbox with system back
    Given the image is open in the lightbox
    When I trigger the system back request
    Then the lightbox is dismissed
    And I return to the activity slide

  @s10
  Scenario: Expand control exposes a localized accessible label
    Given a slide whose image URL has resolved
    When the slide renders
    Then the expand control exposes a localized accessible label

  @s11
  Scenario: Close control exposes a localized accessible label
    Given the image is open in the lightbox
    Then the close control exposes a localized accessible label

  @s12
  Scenario Outline: Expand and close labels are translated in every supported locale
    Given the app is set to <locale>
    Then the expand and close labels are real translations, not the English base
    Examples:
      | locale |
      | es     |
      | pt     |
      | de     |
```
