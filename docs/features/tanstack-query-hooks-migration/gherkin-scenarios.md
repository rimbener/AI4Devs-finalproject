# Gherkin — tanstack-query-hooks-migration

```gherkin
Feature: TanStack Query hooks migration
  As a developer on this codebase
  I want every service-backed hook to run on @tanstack/react-query
  So that loading, error, caching and stale-response handling come from one audited library

  Background:
    Given every hook consumer is mounted under a single QueryClientProvider
    # Pure refactor: each scenario asserts an observable hook-state contract that must be
    # identical before and after the migration. Most map to an existing adapted test;
    # scenarios marked NEW are added by this feature.

  # ---------------------------------------------------------------------------
  # Slice 0 — auth-change cache reset (D2)
  # ---------------------------------------------------------------------------

  @s1
  Scenario: A different user signing in evicts the previous user's cached data
    Given cached data exists for the signed-in user
    When a session arrives for a different user id
    Then every cached entry other than the session itself is evicted
    And the next read of that data goes to the service rather than the cache

  @s2
  Scenario: A token refresh for the same user preserves the cache
    Given cached data exists for the signed-in user
    When a replacement session arrives for the same user id
    Then no cached entry is evicted
    And no data is re-read from the service

  @s3
  Scenario: Signing out evicts the cached data
    Given cached data exists for the signed-in user
    When the session becomes unauthenticated
    Then every cached entry other than the session itself is evicted

  @s4
  Scenario: The new session is stored after the eviction, not before
    Given cached data exists for the signed-in user
    When a session arrives for a different user id
    Then the session entry holds the new session once the eviction has completed

  # ---------------------------------------------------------------------------
  # Slice 1 — use-lesson
  # ---------------------------------------------------------------------------

  @s5
  Scenario: A lesson loads on mount
    Given a lesson exists for the requested id
    When a consumer mounts the lesson hook
    Then the lesson is exposed with no error
    And loading has finished

  @s6
  Scenario: A lesson with no slides is an empty result, not an error
    Given the requested lesson has no slides
    When a consumer mounts the lesson hook
    Then the lesson is exposed with an empty slide list
    And no error is reported

  @s7
  Scenario: A failed lesson read exposes the error
    Given the lesson read will fail
    When a consumer mounts the lesson hook
    Then the failure is exposed as an error
    And no lesson is exposed
    And loading has finished

  @s8
  Scenario: Refetching after a failed lesson read clears the error
    Given a lesson read has failed
    When the consumer refetches and the read succeeds
    Then the lesson is exposed
    And the error is cleared

  @s9
  Scenario: Requesting a different lesson never shows the previous one
    Given a lesson read for one id is still in flight
    When the consumer requests a different lesson id and that read resolves
    Then the newly requested lesson is exposed
    And the late response for the previous id never replaces it

  # ---------------------------------------------------------------------------
  # Slice 2 — use-lessons
  # ---------------------------------------------------------------------------

  @s10
  Scenario: The lesson list loads on mount
    Given the learner has saved lessons
    When a consumer mounts the lessons hook
    Then the lessons are exposed with no error
    And loading has finished

  @s11
  Scenario: A learner with no lessons gets an empty list
    Given the learner has no saved lessons
    When a consumer mounts the lessons hook
    Then an empty lesson list is exposed
    And no error is reported

  @s12
  Scenario: A failed list read exposes the error and an empty list
    Given the lessons read will fail
    When a consumer mounts the lessons hook
    Then the failure is exposed as an error
    And the lesson list is empty

  @s13
  Scenario: Refetching after a failed list read clears the error
    Given the lessons read has failed
    When the consumer refetches and the read succeeds
    Then the lessons are exposed
    And the error is cleared

  @s14
  Scenario: Deleting a lesson removes it from the cached list without re-reading
    Given the lesson list has loaded
    When the consumer deletes one lesson and the service succeeds
    Then that lesson is gone from the exposed list
    And the list is not re-read from the service

  @s15
  Scenario: A failed delete rejects to the caller and leaves the list unchanged
    Given the lesson list has loaded
    When the consumer deletes a lesson and the service fails
    Then the delete call rejects to the caller
    And the exposed list is unchanged
    And the failure is exposed as an error

  @s16
  Scenario: A delete error outranks a read error and is cleared by a refetch
    Given a lesson delete has failed
    When the consumer refetches the list
    Then the delete error is cleared before the read starts
    And any later read failure is the error that is exposed

  # ---------------------------------------------------------------------------
  # Slice 3 — use-pdf-documents
  # ---------------------------------------------------------------------------

  @s17
  Scenario: The document list loads on mount
    Given the learner has uploaded documents
    When a consumer mounts the documents hook
    Then the documents are exposed with no error
    And loading has finished

  @s18
  Scenario: A learner with no documents gets an empty list
    Given the learner has no uploaded documents
    When a consumer mounts the documents hook
    Then an empty document list is exposed
    And no error is reported

  @s19
  Scenario: A failed document read exposes the error and an empty list
    Given the documents read will fail
    When a consumer mounts the documents hook
    Then the failure is exposed as an error
    And the document list is empty

  @s20
  Scenario: Refetching after a failed document read clears the error
    Given the documents read has failed
    When the consumer refetches and the read succeeds
    Then the documents are exposed
    And the error is cleared

  @s21
  Scenario: Deleting a document removes it from the cached list without re-reading
    Given the document list has loaded
    When the consumer deletes one document and the service succeeds
    Then that document is gone from the exposed list
    And the list is not re-read from the service

  @s22
  Scenario: A failed document delete rejects to the caller and leaves the list unchanged
    Given the document list has loaded
    When the consumer deletes a document and the service fails
    Then the delete call rejects to the caller
    And the exposed list is unchanged
    And the failure is exposed as an error

  @s23
  Scenario: A document delete error outranks a read error and is cleared by a refetch
    Given a document delete has failed
    When the consumer refetches the list
    Then the delete error is cleared before the read starts
    And any later read failure is the error that is exposed

  # ---------------------------------------------------------------------------
  # Slice 4 — use-slide-image-url
  # ---------------------------------------------------------------------------

  @s24
  Scenario: The image cache window is derived from the signed-URL lifetime
    Given the signed-URL lifetime is published by the image service
    When the image hook configures its cache
    Then both its freshness and its retention windows are derived from that lifetime
    And both are strictly shorter than it, so a served cache hit is always still valid

  @s25
  Scenario: A slide with no image resolves to no url
    Given a slide has no image reference
    When a consumer mounts the image-url hook
    Then no url is exposed
    And it is not loading
    And the signing service is never called

  @s26
  Scenario: A slide with an image resolves a signed url
    Given a slide has an image reference
    When a consumer mounts the image-url hook
    Then it reports loading and then exposes the signed url

  @s27
  Scenario: A signing failure degrades to no url without throwing
    Given signing the slide image cannot produce a url
    When a consumer mounts the image-url hook
    Then no url is exposed
    And loading has finished
    And nothing throws

  @s28
  Scenario: Two slides with different images never share a url
    Given a url request for one slide image is still in flight
    When the consumer switches to a different slide image and that request resolves
    Then the newly requested url is exposed
    And the late response for the previous image never replaces it

  @s29
  Scenario: Re-viewing the same slide inside the cache window skips a second signing
    Given a slide image url has already been signed
    When the same slide is viewed again within the cache window
    Then the cached url is served immediately
    And the signing service is not called a second time

  # ---------------------------------------------------------------------------
  # Slice 5 — use-lesson-attempt
  # ---------------------------------------------------------------------------

  @s30
  Scenario: A saved attempt moves from idle through saving to saved
    Given no attempt has been submitted
    When the consumer submits an attempt and the service succeeds
    Then the status moves from idle to saving and then to saved
    And the saved attempt is exposed

  @s31
  Scenario: A failed save moves to error with no attempt retained
    Given no attempt has been submitted
    When the consumer submits an attempt and the service fails
    Then the status is error
    And no attempt is exposed

  @s32
  Scenario: A later separate save is a fresh insert
    Given an attempt has already been saved
    When the consumer submits another attempt after the first has settled
    Then the service is called a second time
    And the most recently saved attempt is exposed

  @s33
  Scenario: Two saves in the same tick insert only once
    Given no attempt has been submitted
    When the consumer submits the same attempt twice within one tick
    Then the service is called exactly once
    And only one attempt is recorded

  @s34
  Scenario: A save while another is in flight is refused, not queued
    Given an attempt save is in flight
    When the consumer submits another attempt
    Then the second submission is refused
    And it is not run once the first one settles

  @s35
  Scenario: Retry replays the last submitted attempt
    Given an attempt save has failed
    When the consumer retries and the service succeeds
    Then the service is called again with the same attempt
    And the status becomes saved with the returned attempt

  @s36
  Scenario Outline: Retry does nothing when there is nothing to replay
    Given <context>
    When the consumer retries
    Then the service is not called again
    And the status is unchanged

    Examples:
      | context                          |
      | no attempt has ever been submitted |
      | an attempt save is already in flight |

  # ---------------------------------------------------------------------------
  # Slice 6 — use-api-key (+ ApiKeyProvider removal)
  # ---------------------------------------------------------------------------

  @s37
  Scenario: An authenticated learner's key status loads under their own cache key
    Given the learner is authenticated
    When a consumer mounts the api-key hook
    Then the stored key status is exposed under a cache key scoped to that learner
    And loading has finished

  @s38
  Scenario: An unauthenticated visitor gets an empty status
    Given there is no session
    When a consumer mounts the api-key hook
    Then an empty key status is exposed
    And it is not loading
    And the status service is never called

  @s39
  Scenario: A still-resolving session keeps the status loading
    Given the session is still resolving
    When a consumer mounts the api-key hook
    Then it reports loading
    And the status service is not called yet

  @s40
  Scenario: A different signed-in user never sees the previous user's key status
    Given one learner's key status has loaded
    When the signed-in user changes
    Then the new learner's status is read under their own cache key
    And the previous learner's status is never exposed

  @s41
  Scenario: A replaced session for the same user does not re-read the status
    Given a learner's key status has loaded
    When the session is replaced for the same user
    Then the status service is not called again

  @s42
  Scenario: A status read in flight before logout never overwrites the empty status
    Given a key-status read is in flight for a signed-in learner
    When the session becomes unauthenticated and the earlier read then resolves
    Then the exposed status stays empty

  @s43
  Scenario: Saving a key writes the returned status straight to the cache
    Given the learner is authenticated
    When the consumer saves a provider key and the service succeeds
    Then the status returned by the service is exposed
    And the status is not re-read from the service

  @s44
  Scenario: Removing a key writes the returned status straight to the cache
    Given the learner has a saved provider key
    When the consumer removes it and the service succeeds
    Then the status returned by the service is exposed
    And the status is not re-read from the service

  @s45
  Scenario: A failed save exposes a normalized error code and preserves the status
    Given the learner is authenticated
    When the consumer saves a key and the service fails with a known code
    Then that error code is exposed
    And the previously loaded status is unchanged
    And the call rejects to the caller

  @s46
  Scenario: An unrecognized failure normalizes to the network error code
    Given the learner is authenticated
    When the consumer saves a key and the service fails with no recognized code
    Then the network error code is exposed

  @s47
  Scenario: A successful remove clears an error left by a failed save
    Given a key save has failed and its error is exposed
    When the consumer removes a key and the service succeeds
    Then no error is exposed

  @s48
  Scenario Outline: Submitting covers both saving and removing
    Given the learner is authenticated
    When the consumer <action> and the call is in flight
    Then it reports submitting
    And it stops reporting submitting once the call settles

    Examples:
      | action           |
      | saves a key      |
      | removes a key    |

  @s49
  Scenario: Two key-status consumers share one read with no provider in the tree
    Given the learner is authenticated
    And no api-key provider is present in the tree
    When two separate consumers mount the api-key hook
    Then the status service is called once
    And both consumers see the same status

  @s50
  Scenario: The raw key is never retained in the hook's state
    Given the learner is authenticated
    When the consumer saves a provider key
    Then no part of the exposed hook state contains the raw key

  # ---------------------------------------------------------------------------
  # Slice 7 — use-profile (+ ProfileProvider removal)
  # ---------------------------------------------------------------------------

  @s51
  Scenario: An authenticated learner's profile loads under their own cache key
    Given the learner is authenticated
    When a consumer mounts the profile hook
    Then the profile is exposed under a cache key scoped to that learner
    And loading has finished

  @s52
  Scenario: An unauthenticated visitor has no profile
    Given there is no session
    When a consumer mounts the profile hook
    Then no profile is exposed
    And it is not loading
    And the profile service is never called

  @s53
  Scenario Outline: Loading is true while any contributing read is loading
    Given <source> is still loading
    When a consumer mounts the profile hook
    Then it reports loading

    Examples:
      | source           |
      | the session      |
      | the key status   |
      | the profile read |

  @s54
  Scenario: The profile is withheld while loading and while errored
    Given the profile read will fail
    When a consumer mounts the profile hook
    Then no profile is exposed at any point
    And the failure is exposed as an error

  @s55
  Scenario Outline: Creation is allowed on a platform plan or with a saved key
    Given the learner's profile has loaded
    And <condition>
    When a consumer reads the profile
    Then creation is <allowed>

    Examples:
      | condition                                | allowed     |
      | the plan uses the platform key           | allowed     |
      | the learner has a saved provider key     | allowed     |
      | neither of those holds                   | not allowed |

  @s56
  Scenario: Retry re-reads a failed profile
    Given the profile read has failed
    When the consumer retries and the read succeeds
    Then the profile is exposed
    And the error is cleared

  @s57
  Scenario: A session becoming unauthenticated resets the profile
    Given a learner's profile has loaded
    When the session becomes unauthenticated
    Then no profile is exposed
    And it is not loading

  @s58
  Scenario: Two profile consumers share one read with no provider in the tree
    Given the learner is authenticated
    And no profile provider is present in the tree
    When two separate consumers mount the profile hook
    Then the profile service is called once
    And both consumers see the same profile
```

## Not covered by scenarios

Slice 8 (task-10 – task-12) is documentation only — the **Exemptions** section in `.agents/rules/tanstack-query.mdc`, the stale-comment sweep, and the `AGENTS.md` correction. Prose changes are not behavioral, so they carry no `@s` tag; they are verified by the `dod_validator` checklist plus a repo-wide search asserting no remaining "tanstack-query not installed" strings.
