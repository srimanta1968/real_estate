@feature_id:eb9ab1c3-6b51-418a-b3d6-a33b99bbcfe7
@epic_id:0030b503-b5e4-40e8-b638-d949cf070623
Feature: Scenario Comparison Charts
  Compares different scenarios and displays results graphically for user analysis.

  @scenario_id:9c492e89-0595-4227-a19e-f8c5e97d5682
  @scenario_type:UI
  @ui_test
  Scenario: Comparison charts accurately represent different scenarios.
    # Scenario ID: 9c492e89-0595-4227-a19e-f8c5e97d5682
    # Feature ID: eb9ab1c3-6b51-418a-b3d6-a33b99bbcfe7
    # Scenario Type: UI
    # Description: Comparison charts accurately represent different scenarios.
    Given The user is on the scenario comparison page
    When The user selects two or more scenarios to compare
    Then The system displays comparison charts for multiple scenarios
    And The charts show accurate data points for each scenario
    And The user confirms the data representation is correct
    # Priority: high
    # Status: draft
    # Test Runner Info: feature_id=eb9ab1c3-6b51-418a-b3d6-a33b99bbcfe7, scenario_id=9c492e89-0595-4227-a19e-f8c5e97d5682, type=UI

  @scenario_id:fa4189e1-4236-49ef-ae8e-012ccd4d24c6
  @scenario_type:UI
  @ui_test
  Scenario: Users can switch between scenarios easily.
    # Scenario ID: fa4189e1-4236-49ef-ae8e-012ccd4d24c6
    # Feature ID: eb9ab1c3-6b51-418a-b3d6-a33b99bbcfe7
    # Scenario Type: UI
    # Description: Users can switch between scenarios easily.
    Given The user has multiple scenarios available for comparison
    When The user is viewing a comparison chart
    Then The user clicks on a scenario switcher button
    And The system displays the new scenario's comparison chart
    And The user verifies the correct chart is shown for the selected scenario
    # Priority: high
    # Status: draft
    # Test Runner Info: feature_id=eb9ab1c3-6b51-418a-b3d6-a33b99bbcfe7, scenario_id=fa4189e1-4236-49ef-ae8e-012ccd4d24c6, type=UI

  @scenario_id:409967ef-74a5-4ad0-a677-3b64776da64c
  @scenario_type:UI
  @ui_test
  Scenario: Charts load within 500ms.
    # Scenario ID: 409967ef-74a5-4ad0-a677-3b64776da64c
    # Feature ID: eb9ab1c3-6b51-418a-b3d6-a33b99bbcfe7
    # Scenario Type: UI
    # Description: Charts load within 500ms.
    Given The user is on the scenario comparison page
    When The user selects scenarios for comparison
    Then The user initiates loading of comparison charts
    And The charts are displayed within 500 milliseconds
    And The user confirms that the loading time is acceptable
    # Priority: high
    # Status: draft
    # Test Runner Info: feature_id=eb9ab1c3-6b51-418a-b3d6-a33b99bbcfe7, scenario_id=409967ef-74a5-4ad0-a677-3b64776da64c, type=UI
