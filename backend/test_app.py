import pytest
import json
from flask_jwt_extended import create_access_token
from app import app, db # Assuming app.py is in the same directory or accessible

@pytest.fixture(scope='module')
def test_client():
    flask_app = app
    flask_app.config.update({
        "TESTING": True,
        # Add other test-specific configurations if needed, e.g., a test database
        "JWT_SECRET_KEY": "test-secret-key", # Consistent key for testing
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", # Use in-memory for tests
    })

    with flask_app.test_client() as testing_client:
        with flask_app.app_context():
            # db.create_all() # Create tables if your test interacts with db
            pass
        yield testing_client
        # with flask_app.app_context():
            # db.drop_all() # Clean up db after tests if created
            # pass

def test_get_assets_no_token(test_client):
    response = test_client.get('/assets')
    assert response.status_code == 401
    expected_response = {"msg": "Missing Authorization Header"}
    assert json.loads(response.data) == expected_response

def test_get_assets_with_invalid_signature_token(test_client):
    with test_client.application.app_context():
        identity_data = {'id': 999, 'username': 'test_tamper'}
        # This uses the app's configured JWT_SECRET_KEY ('test-secret-key' from fixture)
        valid_token = create_access_token(identity=json.dumps(identity_data))

    parts = valid_token.split('.')
    if len(parts) == 3:
        header, payload, signature = parts
        # Tamper the signature
        tampered_signature = signature + "invalid"
        tampered_token = f"{header}.{payload}.{tampered_signature}"
    else:
        # Fail the test if token isn't in expected format, something is wrong
        pytest.fail("Generated token does not have three parts.")

    response = test_client.get('/assets', headers={'Authorization': f'Bearer {tampered_token}'})
    assert response.status_code == 422
    expected_response = {"msg": "Signature verification failed"}
    assert json.loads(response.data) == expected_response

# Add more tests here if needed
