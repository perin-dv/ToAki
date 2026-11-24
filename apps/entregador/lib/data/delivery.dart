class Delivery {
  final String id;
  final String empresaId;
  final String number;
  final String recipient;
  final String destination;
  final String vehicle;
  final String status;
  const Delivery({required this.id,required this.empresaId,required this.number,
    required this.recipient,required this.destination,required this.vehicle,required this.status});
  factory Delivery.fromJson(Map<String,dynamic> json) => Delivery(
    id:json['pedidoId']?.toString()??'',
    empresaId:json['empresaId']?.toString()??'',
    number:json['numeroNF']?.toString()??'',
    recipient:json['destinatario']?.toString()??'Cliente',
    destination:json['endereco']?.toString()??'',
    vehicle:json['veiculo']?.toString()??'',
    status:json['status']?.toString()??'pendente',
  );
  Delivery withStatus(String value) => Delivery(
    id:id,empresaId:empresaId,number:number,recipient:recipient,
    destination:destination,vehicle:vehicle,status:value,
  );
  static const demo=Delivery(
    id:'nf_20261124001',empresaId:'empresa_teste_soma',
    number:'20261124001',recipient:'Sakamoto (teste)',
    destination:'Endereço ilustrativo — Maringá, PR',
    vehicle:'Moto · TST1A24',status:'pendente',
  );
}

String statusLegivel(String status) => switch(status){
  'pendente'=>'Aguardando saída',
  'em_rota'=>'Entrega em andamento',
  'entregue'=>'Entregue',
  'cancelada'=>'Cancelada',
  _=>'Situação não informada'
};
