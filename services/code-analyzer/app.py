from flask import Flask, jsonify
from datetime import datetime
import os

app = Flask(__name__)

# Configuration
app.config['DATABASE_URL'] = os.getenv('DATABASE_URL', '')
app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY', '')
app.config['TEMP_CLONE_DIR'] = os.getenv('TEMP_CLONE_DIR', '/tmp/code-analysis')
app.config['NOTIFICATION_SERVICE_URL'] = os.getenv('NOTIFICATION_SERVICE_URL', 'http://notifications:5001')


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'UP',
        'service': 'code-analyzer',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })


@app.route('/db-test', methods=['GET'])
def db_test():
    """Database connectivity test"""
    db_connected = False
    db_message = ''
    
    try:
        import cx_Oracle
        
        database_url = app.config['DATABASE_URL']
        if database_url:
            # Parse oracle+cx_oracle://user:password@host:port/service
            import re
            match = re.match(r'oracle\+cx_oracle://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', database_url)
            
            if match:
                user, password, host, port, service = match.groups()
                dsn = cx_Oracle.makedsn(host, int(port), service_name=service)
                
                connection = cx_Oracle.connect(user=user, password=password, dsn=dsn)
                cursor = connection.cursor()
                cursor.execute('SELECT 1 FROM DUAL')
                result = cursor.fetchone()
                
                if result:
                    db_connected = True
                    db_message = 'Oracle database connected successfully'
                
                cursor.close()
                connection.close()
            else:
                db_message = 'Invalid DATABASE_URL format'
        else:
            db_message = 'DATABASE_URL not configured'
            
    except ImportError:
        db_message = 'cx_Oracle module not available'
    except Exception as e:
        db_message = f'Exception: {str(e)}'
    
    return jsonify({
        'service': 'code-analyzer',
        'database': 'connected' if db_connected else 'disconnected',
        'message': db_message,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    """Placeholder for code analysis endpoint"""
    return jsonify({
        'status': 'not_implemented',
        'message': 'Code analysis endpoint - to be implemented',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true')
