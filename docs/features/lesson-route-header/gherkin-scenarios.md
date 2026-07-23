Feature: Lesson-route header
  As a Study Buddy user (web and native), I want the lesson detail, player, and
  results screens to show a header with a back button and title, so I have a
  clear, native way back to my lessons from any pushed screen.

  @s1
  Scenario: Lesson detail shows a header with title and back button
    Given I have navigated to the lesson detail screen (lesson/[id]/index)
    When the screen renders
    Then I see a header showing the "nav.lesson" title
    And the header shows a back button

  @s2
  Scenario: Player shows a header with title and back button
    Given I have navigated to the lesson player screen (lesson/[id]/player)
    When the screen renders
    Then I see a header showing the "nav.study" title
    And the header shows a back button

  @s3
  Scenario: Results screen is configured with a header
    Given the results route (lesson/[id]/results) is registered in the app stack
    When the app stack is configured
    Then the results screen carries a header with the "nav.results" title and a back button
    # Note: results.tsx currently redirects to player, so this header is
    # practically invisible today; it is configured for AC completeness and to
    # stay correct if the redirect is ever removed.

  @s4
  Scenario: Header back button returns to the previous screen
    Given I am on a pushed lesson screen with a header back button
    When I tap the header back button
    Then I return to the previous screen
    And when I reached the lesson screen via a deep link, I land on the tab shell

  @s5
  Scenario Outline: Header renders across platforms
    Given I am on a pushed lesson screen
    When the screen renders on <platform>
    Then I see the header with the screen title and a back button using the default navigation header

    Examples:
      | platform    |
      | native iOS  |
      | native Android |
      | narrow web  |
      | desktop web |

  @s6
  Scenario Outline: Player keeps its header across every state
    Given I am on the lesson player screen
    When the player is in the <state> state
    Then the header with the "nav.study" title and back button is still shown
    And the existing in-screen "Back" / "Retake" / "Back to my lessons" actions are unchanged

    Examples:
      | state   |
      | loading |
      | empty   |
      | error   |
      | loaded  |

  @s7
  Scenario Outline: Root tab screens stay headerless on every platform
    Given I am on a root tab screen (<tab>)
    When the screen renders on any platform
    Then no header is shown
    And no navigation Stack is nested inside a NativeTabs.Trigger

    Examples:
      | tab       |
      | Home      |
      | PDF files |
      | Settings  |

  @s8
  Scenario: Lesson-stack screen config exposes exactly the three lesson routes
    Given the lesson-stack screen-config factory
    When it is invoked
    Then it returns exactly three screen entries in order:
      | name                  | titleKey    |
      | lesson/[id]/index     | nav.lesson  |
      | lesson/[id]/player    | nav.study   |
      | lesson/[id]/results   | nav.results |
