# Gherkin scenarios — activity-image-split-layout

```gherkin
Feature: Split (side-by-side) slide layout for portrait images
  As a learner, I want a portrait slide image to sit beside the slide body on wide
  (landscape) screens, so a tall image does not push the activity down and I can see
  the image and the interaction together.

  Background:
    Given a slide whose image resolves to a displayable URL
    And the slide is rendered inside the lesson player

  # --- Split happy path -------------------------------------------------------

  @s1
  Scenario: Portrait image on a landscape viewport splits into title + 50/50 row
    Given the slide image is portrait (height greater than width)
    And the viewport is wider than it is tall
    And the available height for the slide has been measured
    When the slide renders
    Then the title is shown full-width across the top
    And below the title a content row shows the image on the left and the body on the right
    And the image and body columns share the row equally (about 50/50)

  @s2
  Scenario: In split layout the image is contained (not cropped) and still expandable
    Given the slide is showing the split layout
    When the image renders in its half
    Then the image is contained within its column with no crop
    And the image is bounded to the available pane height so it does not dominate vertically
    And the expand control is present and opens the fullscreen lightbox as before

  @s3
  Scenario: In split layout the body scrolls in its own pane while the image sits apart
    Given the slide is showing the split layout
    And the body content is taller than the image pane
    When the layout is inspected
    Then the body occupies its own scrollable pane
    And the image sits in a separate column that is not part of the body's scroller
    # Structure only — true pixel-stickiness is best-effort (nested scroller, Q2=B).

  # --- Stacked (fallback) behaviors -------------------------------------------

  @s4
  Scenario: A landscape image stays stacked (image above body)
    Given the slide image is landscape (width greater than height)
    And the viewport is wider than it is tall
    When the slide renders
    Then the layout is stacked with the image above the body, as before

  @s5
  Scenario: A square image stays stacked
    Given the slide image is square (width equal to height)
    And the viewport is wider than it is tall
    When the slide renders
    Then the layout is stacked with the image above the body

  @s6
  Scenario: A portrait image on a portrait or narrow viewport stays stacked
    Given the slide image is portrait (height greater than width)
    And the viewport is not wider than it is tall
    When the slide renders
    Then the layout is stacked with the image above the body

  @s7
  Scenario: A slide with no image is unchanged
    Given the slide has no image
    When the slide renders
    Then the layout is unchanged and no image column is shown

  # --- Guards and edges -------------------------------------------------------

  @s8
  Scenario: Before the available height is known, layout stays stacked
    Given the slide image is portrait (height greater than width)
    And the viewport is wider than it is tall
    And the available height for the slide has not yet been measured
    When the slide renders
    Then the layout is stacked
    And it switches to split once the available height is measured

  @s9
  Scenario Outline: Non-positive image dimensions are not treated as portrait
    Given the slide image has <dims>
    And the viewport is wider than it is tall
    When the slide renders
    Then the layout is stacked

    Examples:
      | dims                     |
      | zero width               |
      | zero height              |
      | negative or missing size |

  @s10
  Scenario Outline: Layout reacts to viewport orientation changes
    Given the slide image is portrait (height greater than width)
    And the available height for the slide has been measured
    When the viewport orientation is <orientation>
    Then the layout is <layout>

    Examples:
      | orientation            | layout  |
      | wider than it is tall  | split   |
      | taller than it is wide | stacked |

  # --- Applies across every slide kind ---------------------------------------

  @s11
  Scenario Outline: The same rules apply to every slide kind with an image
    Given a <kind> slide with a portrait image
    And the viewport is wider than it is tall
    And the available height for the slide has been measured
    When the slide renders
    Then it uses the split layout (image left, body right)

    Examples:
      | kind               |
      | instructional      |
      | multiple-choice    |
      | fill-in-the-blank  |
      | flashcard          |
      | matching           |
      | open-ended         |

  # --- Accessibility ----------------------------------------------------------

  @s12
  Scenario: Reading and focus order is preserved in split layout
    Given the slide is showing the split layout
    When assistive technology traverses the slide
    Then the order is title, then image, then body/activity, matching the stacked order
    And the body pane is reachable and scrollable by keyboard

  # --- Cross-layer height plumbing -------------------------------------------

  @s13
  Scenario: The player measures the available body height and feeds it to the slide
    Given the lesson player is showing a slide with a portrait image on a landscape viewport
    When the player has measured its body area
    Then it passes the measured available height to the slide
    And the slide uses that height to bound the image and size the split row
    And before that measurement the slide is stacked

  # --- Stacked-mode regression guard -----------------------------------------

  @s14
  Scenario: Stacked image sizing is unchanged
    Given the slide is showing the stacked layout
    When the image renders
    Then it keeps the existing width-driven sizing capped at the readable content width
```
