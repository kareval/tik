import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FactorialService } from '../services/factorialService';

export const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Procesando autenticación...');

    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) {
            setStatus('Error: No se recibió código de autorización.');
            return;
        }

        const processAuth = async () => {
            try {
                const redirectUri = window.location.origin + '/auth/callback';
                await FactorialService.exchangeCodeForToken(code, redirectUri);
                setStatus('Autenticación exitosa. Redirigiendo...');
                setTimeout(() => navigate('/settings'), 1500);
            } catch (error) {
                console.error(error);
                setStatus('Error durante la autenticación. Revisa la consola.');
            }
        };

        processAuth();
    }, [searchParams, navigate]);

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
            <div className="p-8 bg-white dark:bg-gray-800 shadow rounded-lg text-center">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Conectando con Factorial</h2>
                <div className="text-gray-600 dark:text-gray-300">{status}</div>
                <div className="mt-4 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        </div>
    );
};
