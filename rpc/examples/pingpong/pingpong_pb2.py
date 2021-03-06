# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: pingpong.proto

from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from google.protobuf import reflection as _reflection
from google.protobuf import symbol_database as _symbol_database
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor.FileDescriptor(
  name='pingpong.proto',
  package='pingpong',
  syntax='proto3',
  serialized_options=None,
  serialized_pb=b'\n\x0epingpong.proto\x12\x08pingpong\"\x1c\n\rNumberRequest\x12\x0b\n\x03num\x18\x01 \x01(\x05\"\"\n\x0f\x45venOddResponse\x12\x0f\n\x07message\x18\x01 \x01(\t2P\n\x08PingPong\x12\x44\n\x0c\x61skEvenOrOdd\x12\x17.pingpong.NumberRequest\x1a\x19.pingpong.EvenOddResponse\"\x00\x62\x06proto3'
)




_NUMBERREQUEST = _descriptor.Descriptor(
  name='NumberRequest',
  full_name='pingpong.NumberRequest',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    _descriptor.FieldDescriptor(
      name='num', full_name='pingpong.NumberRequest.num', index=0,
      number=1, type=5, cpp_type=1, label=1,
      has_default_value=False, default_value=0,
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  serialized_options=None,
  is_extendable=False,
  syntax='proto3',
  extension_ranges=[],
  oneofs=[
  ],
  serialized_start=28,
  serialized_end=56,
)


_EVENODDRESPONSE = _descriptor.Descriptor(
  name='EvenOddResponse',
  full_name='pingpong.EvenOddResponse',
  filename=None,
  file=DESCRIPTOR,
  containing_type=None,
  fields=[
    _descriptor.FieldDescriptor(
      name='message', full_name='pingpong.EvenOddResponse.message', index=0,
      number=1, type=9, cpp_type=9, label=1,
      has_default_value=False, default_value=b"".decode('utf-8'),
      message_type=None, enum_type=None, containing_type=None,
      is_extension=False, extension_scope=None,
      serialized_options=None, file=DESCRIPTOR),
  ],
  extensions=[
  ],
  nested_types=[],
  enum_types=[
  ],
  serialized_options=None,
  is_extendable=False,
  syntax='proto3',
  extension_ranges=[],
  oneofs=[
  ],
  serialized_start=58,
  serialized_end=92,
)

DESCRIPTOR.message_types_by_name['NumberRequest'] = _NUMBERREQUEST
DESCRIPTOR.message_types_by_name['EvenOddResponse'] = _EVENODDRESPONSE
_sym_db.RegisterFileDescriptor(DESCRIPTOR)

NumberRequest = _reflection.GeneratedProtocolMessageType('NumberRequest', (_message.Message,), {
  'DESCRIPTOR' : _NUMBERREQUEST,
  '__module__' : 'pingpong_pb2'
  # @@protoc_insertion_point(class_scope:pingpong.NumberRequest)
  })
_sym_db.RegisterMessage(NumberRequest)

EvenOddResponse = _reflection.GeneratedProtocolMessageType('EvenOddResponse', (_message.Message,), {
  'DESCRIPTOR' : _EVENODDRESPONSE,
  '__module__' : 'pingpong_pb2'
  # @@protoc_insertion_point(class_scope:pingpong.EvenOddResponse)
  })
_sym_db.RegisterMessage(EvenOddResponse)



_PINGPONG = _descriptor.ServiceDescriptor(
  name='PingPong',
  full_name='pingpong.PingPong',
  file=DESCRIPTOR,
  index=0,
  serialized_options=None,
  serialized_start=94,
  serialized_end=174,
  methods=[
  _descriptor.MethodDescriptor(
    name='askEvenOrOdd',
    full_name='pingpong.PingPong.askEvenOrOdd',
    index=0,
    containing_service=None,
    input_type=_NUMBERREQUEST,
    output_type=_EVENODDRESPONSE,
    serialized_options=None,
  ),
])
_sym_db.RegisterServiceDescriptor(_PINGPONG)

DESCRIPTOR.services_by_name['PingPong'] = _PINGPONG

# @@protoc_insertion_point(module_scope)
