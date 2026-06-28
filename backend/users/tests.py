from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class RegisterViewTests(APITestCase):
    def test_register_forces_default_user_role(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'username': 'usuario_seguro',
                'email': 'usuario@example.com',
                'password': 'ClaveSegura123!',
                'role': 'ADMIN',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='usuario_seguro')
        self.assertEqual(user.role, 'USER')

    def test_register_rejects_weak_passwords(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'username': 'usuario_debil',
                'email': 'debil@example.com',
                'password': '1234',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username='usuario_debil').exists())


class LoginViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='usuario_login',
            email='login@example.com',
            password='ClaveSegura123!',
            role='USER',
        )

    def test_login_returns_tokens_and_user_shape_expected_by_frontend(self):
        response = self.client.post(
            '/api/auth/login/',
            {
                'username': 'usuario_login',
                'password': 'ClaveSegura123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['id'], self.user.id)
        self.assertEqual(response.data['user']['username'], self.user.username)
        self.assertEqual(response.data['user']['role'], self.user.role)
        self.assertEqual(response.data['user']['email'], self.user.email)

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            '/api/auth/login/',
            {
                'username': 'usuario_login',
                'password': 'incorrecta',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Credenciales invalidas')
