@feature_id:fe2ec5cd-b3e5-44a9-822b-25526ac5ef53
@epic_id:f4cc8370-9d3e-4217-bffe-f183e79fe35e
Feature: Financing Input
  Enables users to input financing details such as loan amount and interest rate.

  @scenario_id:1e88621d-d537-4f5b-99e9-cc115fa30858
  @scenario_type:UI
  @ui_test
  Scenario: Users can input loan amount without errors.
    # Scenario ID: 1e88621d-d537-4f5b-99e9-cc115fa30858
    # Feature ID: fe2ec5cd-b3e5-44a9-822b-25526ac5ef53
    # Scenario Type: UI
    # Description: Users can input loan amount without errors.
    Given the user is on the financing input form
    When the user enters a valid loan amount
    Then the loan amount is accepted without errors
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=fe2ec5cd-b3e5-44a9-822b-25526ac5ef53, scenario_id=1e88621d-d537-4f5b-99e9-cc115fa30858, type=UI

  @scenario_id:35cb8331-f0b5-4f04-8663-a727cce0bcda
  @scenario_type:UI
  @ui_test
  Scenario: Users can input interest rate as a numeric value without errors.
    # Scenario ID: 35cb8331-f0b5-4f04-8663-a727cce0bcda
    # Feature ID: fe2ec5cd-b3e5-44a9-822b-25526ac5ef53
    # Scenario Type: UI
    # Description: Users can input interest rate as a numeric value without errors.
    Given the user is on the financing input form
    When the user enters a valid interest rate
    Then the interest rate is accepted without errors
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=fe2ec5cd-b3e5-44a9-822b-25526ac5ef53, scenario_id=35cb8331-f0b5-4f04-8663-a727cce0bcda, type=UI

  @scenario_id:aab8d879-eb73-4e6d-9f26-2af5cbbd3ef4
  @scenario_type:UI
  @ui_test
  Scenario: The input form validates financing data.
    # Scenario ID: aab8d879-eb73-4e6d-9f26-2af5cbbd3ef4
    # Feature ID: fe2ec5cd-b3e5-44a9-822b-25526ac5ef53
    # Scenario Type: UI
    # Description: The input form validates financing data.
    Given the user is on the financing input form
    When the user submits the financing details with invalid data
    Then the form displays validation errors
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=fe2ec5cd-b3e5-44a9-822b-25526ac5ef53, scenario_id=aab8d879-eb73-4e6d-9f26-2af5cbbd3ef4, type=UI
