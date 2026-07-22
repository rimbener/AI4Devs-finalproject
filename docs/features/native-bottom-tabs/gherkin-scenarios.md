# Gherkin scenarios — native-bottom-tabs

The signed contract. Every `@s` tag is the traceability key the `implementer` and reviewers use;
each maps to ≥ 1 concrete test. Every acceptance criterion maps to ≥ 1 scenario here.

```gherkin
Feature: Native bottom tabs navigation
  As a signed-in learner, I want system-native bottom tabs on iOS, Android, and
  narrow web, with the existing desktop top bar on wide web, so that primary
  navigation feels platform-native. New Lesson is an action launched from My
  lessons, not a tab, so the tab bar holds only durable destinations.

  Background:
    Given I am a signed-in learner
    And I am inside the protected app shell

  @s1
  Scenario: Native platforms show the system tab bar with two tabs
    Given I am on iOS or Android
    When the app shell renders
    Then I see a system-native bottom tab bar
    And it shows two tabs: My lessons and Settings
    And there is no New lesson tab

  @s2
  Scenario: Narrow web shows the native tab bar, not the old mobile chrome
    Given my web viewport width is below 768
    When the app shell renders
    Then I see the native bottom tab bar with My lessons and Settings
    And I do not see the retired custom mobile bar

  @s3
  Scenario: Wide web shows the desktop top bar with no New lesson or Settings nav items
    Given my web viewport width is at least 768
    When the app shell renders
    Then I see the existing desktop top bar with My lessons
    And New lesson is not a destination in the desktop top bar
    And Settings is not a destination in the desktop top bar
    And I do not see a bottom tab bar

  @s4
  Scenario Outline: A tab navigates to its destination
    Given the native tab bar is visible
    When I choose <tab>
    Then I navigate to <route>

    Examples:
      | tab        | route     |
      | My lessons | /         |
      | Settings   | /settings |

  @s5
  Scenario: The current tab is marked selected for assistive tech and visuals
    Given the native tab bar is visible
    When I am on My lessons or Settings
    Then the matching tab is the selected tab
    And it is exposed as selected to assistive technology

  @s6
  Scenario Outline: New Lesson call to action opens the upload flow
    Given I am on My lessons and the list is in the "<state>" state
    When I activate the New Lesson action
    Then I navigate to "/upload"
    And the action is labelled from "nav.newLesson"

    Examples:
      | state   |
      | content |
      | empty   |

  @s7
  Scenario: The upload flow is immersive with a way back
    Given I open New Lesson from My lessons
    When the upload screen is shown
    Then there is no bottom tab bar
    And there is no desktop top bar
    And a header back control returns me to My lessons

  @s8
  Scenario: My lessons stays the selected tab while the upload flow is open
    Given I open New Lesson from My lessons
    When the upload screen is pushed and then dismissed
    Then My lessons remains the selected tab throughout
    And dismissing returns me to My lessons

  @s9
  Scenario: Lesson flows do not show the tab bar
    Given I open a lesson detail, the lesson player, or the results screen
    When that screen is shown
    Then the bottom tab bar is not visible

  @s10
  Scenario: Tab labels and icons come from existing copy and platform glyphs
    Given the native tab bar renders
    Then My lessons uses "nav.myLessons" with a library glyph
    And Settings uses "nav.settings" with a settings glyph
    And no New lesson glyph appears in the tab bar
    And no new product copy keys are required
    And where a web glyph is unavailable the tab falls back to a label only

  @s11
  Scenario: Settings stays reachable on wide web via the account menu
    Given my web viewport width is at least 768
    When I open the account menu from the desktop avatar
    Then I can open Settings from it
    And the desktop top bar itself still exposes no Settings destination

  @s12
  Scenario: Sign out on wide web stays in the account menu
    Given my web viewport width is at least 768
    When I open the account menu from the desktop avatar
    Then Sign out is available there as before

  @s13
  Scenario: Sign out on native and narrow web lives on the Settings screen
    Given I am on iOS, Android, or a web viewport below 768
    When I open the Settings screen
    Then I see a Sign out action with the existing confirm flow
    And confirming clears my session and returns me to login

  @s14
  Scenario: Wide-web Settings does not duplicate the sign-out action
    Given my web viewport width is at least 768
    When I open the Settings screen
    Then no Sign out action is shown on the Settings screen
    And Sign out remains available from the account menu

  @s15
  Scenario Outline: Platform and viewport select the navigation pattern
    Given I am on "<platform>"
    And my viewport condition is "<viewport>"
    When the app shell renders
    Then I see the "<pattern>" navigation

    Examples:
      | platform | viewport     | pattern     |
      | web      | width >= 768 | desktop bar |
      | web      | width < 768  | native tabs |
      | ios      | any          | native tabs |
      | android  | any          | native tabs |

  @s16
  Scenario: Existing routes and deep links are unchanged by the restructure
    Given the tabs live in a route group that adds no URL segment
    When I open "/", "/upload", "/settings", or a "/lesson/[id]" route directly
    Then each resolves to the same screen as before
    And opening "/upload" directly shows no tab bar
    And a back control from a directly-opened "/upload" returns me to My lessons

  @s17
  Scenario: The retired mobile bar is removed from the design system
    Given the custom mobile bar is no longer wired anywhere
    When the component library is built
    Then the mobile bar component, its stories, and its tests are removed
    And the account menu component remains for the desktop avatar
```
