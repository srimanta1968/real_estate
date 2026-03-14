@feature_id:598fa47a-f1a2-40e5-af99-1f26c2489497
@epic_id:b44ac55e-3da7-410a-9d58-e3cd471d2640
Feature: Cap Rate Calculation
  Calculates the Capitalization Rate based on income and expenses.

  @scenario_id:97a2bb7a-8f66-4044-89c8-66d8bc304389
  @scenario_type:UI
  @ui_test
  Scenario: Cap Rate calculation returns accurate results based on input values
    # Scenario ID: 97a2bb7a-8f66-4044-89c8-66d8bc304389
    # Feature ID: 598fa47a-f1a2-40e5-af99-1f26c2489497
    # Scenario Type: UI
    # Description: Cap Rate calculation returns accurate results based on input values
    Given the user navigates to the Cap Rate Calculation section
    When the user enters income as $100,000 and expenses as $30,000
    Then the system calculates the Cap Rate as 70%
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=598fa47a-f1a2-40e5-af99-1f26c2489497, scenario_id=97a2bb7a-8f66-4044-89c8-66d8bc304389, type=UI

  @scenario_id:7f35d5ad-045a-45e6-8277-2183971dcab5
  @scenario_type:UI
  @ui_test
  Scenario: Calculation is performed in under 500ms
    # Scenario ID: 7f35d5ad-045a-45e6-8277-2183971dcab5
    # Feature ID: 598fa47a-f1a2-40e5-af99-1f26c2489497
    # Scenario Type: UI
    # Description: Calculation is performed in under 500ms
    Given the user navigates to the Cap Rate Calculation section
    When the user enters income and expenses values
    Then the system calculates the Cap Rate within 500ms
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=598fa47a-f1a2-40e5-af99-1f26c2489497, scenario_id=7f35d5ad-045a-45e6-8277-2183971dcab5, type=UI

  @scenario_id:481ef06e-f0a9-4a4f-b3c0-fa9731fb07aa
  @scenario_type:UI
  @ui_test
  Scenario: Results are displayed clearly on the user interface
    # Scenario ID: 481ef06e-f0a9-4a4f-b3c0-fa9731fb07aa
    # Feature ID: 598fa47a-f1a2-40e5-af99-1f26c2489497
    # Scenario Type: UI
    # Description: Results are displayed clearly on the user interface
    Given the user navigates to the Cap Rate Calculation section
    When the user enters income and expenses
    Then the system displays the Cap Rate result clearly on the user interface
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=598fa47a-f1a2-40e5-af99-1f26c2489497, scenario_id=481ef06e-f0a9-4a4f-b3c0-fa9731fb07aa, type=UI
