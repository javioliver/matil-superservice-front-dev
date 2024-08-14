const data = {
    'functions': 
    [
      {
        'id': 0,
        'description': 'Esta función sirve para calcular un presupuesto aproximado según el sector, los mercados, el volumen de facturación y el riesgo vivo que quiera asegurar el candidato.',
        'module': 'credito_y_caucion',
        'name': 'calcular_presupuesto_aproximado',
        'args':
        {
          'sector': 'str',
          'mercados': 'list[str]',
          'vol_fac': 'float',
          'riesgo_vivo': 'float'
        },
        'return_type': 'float'
      },
      {
        'id': 1,
        'description': 'Esta función sirve para agendar una reunión con un cliente en el calendario de google',
        'module': 'credito_y_caucion',
        'name': 'agendar_reunion',
        'args':
        {
          'mes': 'int',
          'dia': 'int',
          'hora': 'float',
          'tlf': 'str',
          'nombre_cliente': 'float'
        },
        'return_type': 'str'
      }
    ],
    'flows':
    [
      {
        'id': 0,
        'name': 'Embudo de ventas',
        'description': 'Este es un flujo proactivo mediante el cual se filtra de entre nuestros clientes actuales, algunos de los cuales ya están con la competencia, y se les plantea la idea de contratar un seguro de crédito con nosotros. Si les gusta la idea, se les pide cuatro datos básicos con los que podemos pasarle una aproximación de cuánto les puede costar, todo esto con la intención de cerrar una reunión seria con clientes que conocen los precios.',
        'nodes':
        [
          {
            'id': 0,
            'terminate': false,
            'requirements':
            [
              {
                'id': 0,
                'type': 'string',
                'description': '¿Quiere que le hagamos una aproximación del seguro de crédito o tiene interés en seguir hablando? ¿O, por el contrario, no muestra interés?',
                'values': ['Sí', 'No']
              }
            ],
            'branches': 
            [
              {
                'name': 'Sí que quiere aproximación',
                'conditions':
                [
                  {
                    'requirement_id': 0,
                    'op': 'eq',
                    'value': 'Sí'
                  }
                ],
                'functions':
                [
                ],
                'next_node_id': 1
              },
              {
                'name': 'No quiere aproximación',
                'conditions':
                [
                  {
                    'requirement_id': 0,
                    'op': 'eq',
                    'value': 'No'
                  }
                ],
                'next_node_id': 4
              }
            ]
          },
          {
            'id': 1,
            'terminate': false,
            'requirements':
            [
              {
                'id': 0,
                'type': 'str',
                'description': '¿Cuál es su sector?',
                'values': ['Industrial', 'Educación', 'Alimentación']
              },
              {
                'id': 1,
                'type': 'list[str]',
                'description': '¿En qué mercados opera?',
                'values': ['España', 'Portugal', 'Italia']
              },
              {
                'id': 2,
                'type': 'float',
                'description': '¿Cuál es su volumen de facturación?',
              },
              {
                'id': 3,
                'type': 'float',
                'description': '¿Qué riesgo vivo quiere asegurar?',
              }
            ],
            'branches':
            [
              {
                'name': 'Se tiene un presupuesto',
                'conditions':
                [
                ],
                'functions':
                [
                ],
                'next_node_id': 2
              }
            ]
          },
          {
            'id': 2,
            'terminate': false,
            'requirements':
            [
              {
                'id': 0,
                'type': 'str',
                'description': '¿Quiere recalcular la póliza?',
                'values': ['Sí', 'No']
              },
              {
                'id': 1,
                'type': 'str',
                'description': '¿Quiere agendar una reunión por teléfono?',
                'values': ['España', 'Portugal', 'Italia']
              }
            ],
            'branches':
            [
              {
                'name': 'Quiere recalcular póliza',
                'conditions':
                [
                  {
                    'requirement_id': 0,
                    'op': 'eq',
                    'value': 'Sí'
                  }
                ],
                'functions':
                [
                ],
                'next_node_id': 1
              },
             {
                'name': 'Quiere agendar reunión',
                'conditions':
                [
                  {
                    'requirement_id': 1,
                    'op': 'eq',
                    'value': 'Sí'
                  }
                ],
                'functions':
                [
                ],
                'next_node_id': 3
              },
             {
                'name': 'No le ha gustado el presupuesto',
                'conditions':
                [
                  {
                    'requirement_id': 1,
                    'op': 'eq',
                    'value': 'Sí'
                  }
                ],
                'functions':
                [
                ],
                'next_node_id': 5,
              }
            ]
          },
          {
            'id': 3,
            'terminate': false,
            'objective': 'Mostrar alegría por el hecho de que el cliente crea que es una buena idea una reunión y obtener el teléfono y un día y hora de entre los proporcionados en la información relevante.',
            'requirements': 
            [
              {
                'id': 0,
                'type': 'str',
                'description': '¿Qué día y hora?',
                'values': ['29 a las 10:00', '30 a las 12:00']
              },
              {
                'id': 1,
                'type': 'str',
                'description': '¿Qué número de teléfono?',
                'values': []
              }
            ],
            'branches':
            [
              {
                'name': 'Ha escogido un día y hora y ha dado un teléfono',
                'conditions':
                [
                ],
                'functions':
                [
                  {'args':
                  {
                    'fecha': 0,
                    'tlf': 1
                  }}
                ],
                'next_node_id': 6,
                'conversation_classification': 'Reunión cerrada'
              }
            ]
          },
          {
            'id': 4,
            'terminate': true,
            'objective': 'Agradecer el tiempo dedicado y mencionar que esperamos trabajar con él en el futuro.'
          },
          {
            'id': 5,
            'terminate': true,
            'objective': 'Agradecer el tiempo dedicado y mencionar que esperamos trabajar con él en el futuro.'
          },
          {
            'id': 6,
            'terminate': true,
            'objective': 'Agradecer el tiempo dedicado y mencionar que espera el día de la reunión'
          }
        ]
      }
    ]
  }
  
  export default data