import graphene
from graphene_django import DjangoObjectType
from .models import Reservation

# ===== Types =====
class ReservationType(DjangoObjectType):
    class Meta:
        model = Reservation
        fields = "__all__"  # expose tous les champs du modèle


# ===== Inputs =====
class ReservationInput(graphene.InputObjectType):
    nom              = graphene.String(required=True)
    prenom           = graphene.String(required=True)
    email            = graphene.String(required=True)
    destination      = graphene.String(required=True)
    date_voyage      = graphene.Date(required=True)  # exposé en dateVoyage côté API
    # Map explicite : l'API reçoit nombrePersonnes, Python = nombre_personnes
    nombre_personnes = graphene.Int(required=True, name="nombrePersonnes")


# ===== Query =====
class Query(graphene.ObjectType):
    reservations = graphene.List(ReservationType)
    reservation = graphene.Field(ReservationType, id=graphene.ID(required=True))

    def resolve_reservations(self, info):
        user = info.context.user
        if user.is_anonymous:
            return Reservation.objects.none()
        return Reservation.objects.filter(user=user).order_by("-date_reservation")

    def resolve_reservation(self, info, id):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Authentication required")
        try:
            return Reservation.objects.get(id=id, user=user)
        except Reservation.DoesNotExist:
            return None


# ===== Mutations =====
class CreateReservation(graphene.Mutation):
    reservation = graphene.Field(ReservationType)

    class Arguments:
        input = ReservationInput(required=True)

    def mutate(self, info, input):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Authentication required")

        reservation = Reservation.objects.create(
            user=user,
            nom=input.nom,
            prenom=input.prenom,
            email=input.email,
            destination=input.destination,
            date_voyage=input.date_voyage,
            nombre_personnes=input.nombre_personnes,
        )
        return CreateReservation(reservation=reservation)


class UpdateReservation(graphene.Mutation):
    reservation = graphene.Field(ReservationType)

    class Arguments:
        id               = graphene.ID(required=True)
        nom              = graphene.String()
        prenom           = graphene.String()
        email            = graphene.String()
        nombre_personnes = graphene.Int(name="nombrePersonnes")
        destination      = graphene.String()
        date_voyage      = graphene.Date()
        statut           = graphene.String()

    def mutate(
        self, info, id,
        nom=None,
        prenom=None,
        email=None,
        nombre_personnes=None,
        destination=None,
        date_voyage=None,
        statut=None,
    ):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Authentication required")

        try:
            reservation = Reservation.objects.get(id=id, user=user)
        except Reservation.DoesNotExist:
            raise Exception("Reservation not found")

        if nom is not None:
            reservation.nom = nom
        if prenom is not None:
            reservation.prenom = prenom
        if email is not None:
            reservation.email = email
        if nombre_personnes is not None:
            reservation.nombre_personnes = nombre_personnes
        if destination is not None:
            reservation.destination = destination
        if date_voyage is not None:
            reservation.date_voyage = date_voyage
        if statut is not None:
            reservation.statut = statut

        reservation.save()
        return UpdateReservation(reservation=reservation)


class DeleteReservation(graphene.Mutation):
    ok = graphene.Boolean()

    class Arguments:
        id = graphene.ID(required=True)

    def mutate(self, info, id):
        user = info.context.user
        if user.is_anonymous:
            raise Exception("Authentication required")

        try:
            reservation = Reservation.objects.get(id=id, user=user)
        except Reservation.DoesNotExist:
            raise Exception("Reservation not found")

        reservation.delete()
        return DeleteReservation(ok=True)


# ===== Root Mutations =====
class Mutation(graphene.ObjectType):
    create_reservation = CreateReservation.Field()
    update_reservation = UpdateReservation.Field()
    delete_reservation = DeleteReservation.Field()
