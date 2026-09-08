pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        DOCKER_REGISTRY = 'registry.kura-crm.com'
        IMAGE_NAME = "${DOCKER_REGISTRY}/kura-crm-web"
    }

    tools {
        nodejs "${NODE_VERSION}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('TypeCheck') {
            steps {
                sh 'npm run typecheck'
            }
        }

        stage('Lint & Format') {
            steps {
                sh 'npm run lint'
                sh 'npm run format:check'
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'npm run test:coverage'
            }
            post {
                always {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Frontend Code Coverage'
                    ])
                }
            }
        }

        stage('End-to-End Tests') {
            steps {
                sh 'npx playwright install --with-deps chromium'
                sh 'npm run test:e2e'
            }
            post {
                always {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright Report'
                    ])
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Push Docker Image') {
            when {
                branch 'main'
            }
            steps {
                sh "docker push ${IMAGE_NAME}:${BUILD_NUMBER}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    cd k8s
                    kubectl apply -k .
                    kubectl set image deployment/kura-crm-web -n kura-crm web=${IMAGE_NAME}:${BUILD_NUMBER}
                    kubectl rollout status deployment/kura-crm-web -n kura-crm --timeout=5m
                '''
            }
        }
    }

    post {
        success {
            echo 'Frontend pipeline completed successfully!'
        }
        failure {
            echo 'Frontend pipeline failed. Check logs for details.'
        }
        always {
            cleanWs()
        }
    }
}