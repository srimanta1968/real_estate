@feature_id:60ed835b-e98a-48af-a458-4e3cb7305044
@epic_id:f4cc8370-9d3e-4217-bffe-f183e79fe35e
Feature: Expense Input
  Captures various expenses related to the property such as property tax and maintenance.

  @scenario_id:b645e3a2-b9ff-4a5b-a94b-726a89be4405
  @scenario_type:UI
  @ui_test
  Scenario: Users can input property tax without errors
    # Scenario ID: b645e3a2-b9ff-4a5b-a94b-726a89be4405
    # Feature ID: 60ed835b-e98a-48af-a458-4e3cb7305044
    # Scenario Type: UI
    # Description: Users can input property tax without errors
    Given The user is on the expense input form
    When The user enters a valid property tax amount
    Then The property tax is accepted without errors
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=60ed835b-e98a-48af-a458-4e3cb7305044, scenario_id=b645e3a2-b9ff-4a5b-a94b-726a89be4405, type=UI

  @scenario_id:56bd4ba5-13b8-4245-bbcd-366bd6278276
  @scenario_type:UI
  @ui_test
  Scenario: Users can input maintenance costs as a numeric value without errors
    # Scenario ID: 56bd4ba5-13b8-4245-bbcd-366bd6278276
    # Feature ID: 60ed835b-e98a-48af-a458-4e3cb7305044
    # Scenario Type: UI
    # Description: Users can input maintenance costs as a numeric value without errors
    Given The user is on the expense input form
    When The user enters a valid numeric maintenance cost
    Then The maintenance cost is accepted without errors
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=60ed835b-e98a-48af-a458-4e3cb7305044, scenario_id=56bd4ba5-13b8-4245-bbcd-366bd6278276, type=UI

  @scenario_id:efea72aa-fd83-4cbb-ad33-75daaa13e437
  @scenario_type:UI
  @ui_test
  Scenario: The input form validates expense data
    # Scenario ID: efea72aa-fd83-4cbb-ad33-75daaa13e437
    # Feature ID: 60ed835b-e98a-48af-a458-4e3cb7305044
    # Scenario Type: UI
    # Description: The input form validates expense data
    Given The user is on the expense input form
    When The user submits the expense form with invalid data
    Then An error message is displayed indicating invalid data
    # Priority: medium
    # Status: draft
    # Test Runner Info: feature_id=60ed835b-e98a-48af-a458-4e3cb7305044, scenario_id=efea72aa-fd83-4cbb-ad33-75daaa13e437, type=UI
